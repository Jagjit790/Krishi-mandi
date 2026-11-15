
import { NextResponse } from "next/server";

const MAX_LIMIT = 50;
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes

// Temporary in-memory cache
const cache = new Map();

// Prevent duplicate requests for the same search
const pendingRequests = new Map();

export async function GET(request) {
  const apiKey = process.env.DATA_GOV_API_KEY;
  const resourceId = process.env.DATA_GOV_RESOURCE_ID;

  if (!apiKey || !resourceId) {
    return NextResponse.json(
      {
        success: false,
        error: "Government API configuration is missing.",
      },
      { status: 500 }
    );
  }

  const searchParams = new URL(request.url).searchParams;

  const crop = searchParams.get("crop")?.trim() || "";
  const district = searchParams.get("district")?.trim() || "";

  const requestedLimit = Number(searchParams.get("limit") || 20);
  const limit = Number.isInteger(requestedLimit)
    ? Math.min(Math.max(requestedLimit, 1), MAX_LIMIT)
    : 20;

  // Both filters are required
  if (!crop || !district) {
    return NextResponse.json(
      {
        success: false,
        error: "Please select both a crop and a district.",
      },
      { status: 400 }
    );
  }

  if (crop.length > 80 || district.length > 80) {
    return NextResponse.json(
      {
        success: false,
        error: "Crop or district name is too long.",
      },
      { status: 400 }
    );
  }

  // Create a unique key for this search
  const cacheKey = `${crop.toLowerCase()}|${district.toLowerCase()}|${limit}`;

  // 1. Check cache
  const cachedData = cache.get(cacheKey);

  if (cachedData && Date.now() - cachedData.timestamp < CACHE_TTL) {
    return NextResponse.json({
      ...cachedData.data,
      cached: true,
      stale: false,
      fetchedAt: new Date(cachedData.timestamp).toISOString(),
    });
  }

  // 2. Reuse an already-running request
  if (pendingRequests.has(cacheKey)) {
    try {
      const data = await pendingRequests.get(cacheKey);

      return NextResponse.json({
        ...data,
        cached: true,
        stale: false,
      });
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: "Unable to fetch market prices. Please try again.",
        },
        { status: 502 }
      );
    }
  }

  // 3. Fetch fresh data
  const fetchPromise = (async () => {
    const url = new URL(
      `https://api.data.gov.in/resource/${encodeURIComponent(resourceId)}`
    );

    url.searchParams.set("api-key", apiKey);
    url.searchParams.set("format", "json");
    url.searchParams.set("limit", String(limit));
    url.searchParams.set("filters[State]", "Punjab");
    url.searchParams.set("filters[Commodity]", crop);
    url.searchParams.set("filters[District]", district);
    url.searchParams.set("sort[Arrival_Date]", "desc");

    const response = await fetch(url.toString(), {
      cache: "no-store",
      signal: AbortSignal.timeout(20000),
    });

    const data = await response.json();

    if (!response.ok || data.status === "error") {
      throw new Error("Government API request failed.");
    }

    if (!Array.isArray(data.records)) {
      throw new Error("Unexpected government API response.");
    }

    const result = {
      success: true,
      total: data.total ?? null,
      filters: { crop, district, state: "Punjab" },
      records: data.records,
      source: "data.gov.in",
    };

    // Save only successful responses
    cache.set(cacheKey, {
      data: result,
      timestamp: Date.now(),
    });

    return result;
  })();

  pendingRequests.set(cacheKey, fetchPromise);

  try {
    const result = await fetchPromise;

    return NextResponse.json({
      ...result,
      cached: false,
      stale: false,
      fetchedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Mandi API request failed:", error.message);

    // 4. If fresh fetch fails, use expired cached data if available
    const oldData = cache.get(cacheKey);

    if (oldData) {
      return NextResponse.json({
        ...oldData.data,
        cached: true,
        stale: true,
        fetchedAt: new Date(oldData.timestamp).toISOString(),
      });
    }

    return NextResponse.json(
      {
        success: false,
        error:
          error.name === "TimeoutError"
            ? "Government market data took too long to respond. Please try again."
            : "Unable to connect to the government market data service.",
      },
      { status: 502 }
    );
  } finally {
    pendingRequests.delete(cacheKey);
  }
}
