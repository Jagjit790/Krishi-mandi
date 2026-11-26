
import { NextResponse } from "next/server";

export async function GET(request) {
  // Development-only endpoint
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json(
      { success: false, error: "Not found" },
      { status: 404 }
    );
  }

  const apiKey = process.env.DATA_GOV_API_KEY;
  const resourceId = process.env.DATA_GOV_RESOURCE_ID;

  if (!apiKey || !resourceId) {
    return NextResponse.json(
      { success: false, error: "API configuration is missing." },
      { status: 500 }
    );
  }

  const params = new URL(request.url).searchParams;

  // Optional filters
  const district = params.get("district")?.trim() || "";
  const crop = params.get("crop")?.trim() || "";

  // Pagination
  const requestedLimit = Number(params.get("limit") || 50);
  const requestedOffset = Number(params.get("offset") || 0);

  const limit = Number.isInteger(requestedLimit)
    ? Math.min(Math.max(requestedLimit, 1), 50)
    : 50;

  const offset = Number.isInteger(requestedOffset)
    ? Math.max(requestedOffset, 0)
    : 0;

  // Validate filters
  if (district.length > 80 || crop.length > 80) {
    return NextResponse.json(
      {
        success: false,
        error: "Crop or district name is too long.",
      },
      { status: 400 }
    );
  }

  const url = new URL(
    `https://api.data.gov.in/resource/${encodeURIComponent(resourceId)}`
  );

  url.searchParams.set("api-key", apiKey);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("offset", String(offset));
  url.searchParams.set("filters[State]", "Punjab");
  url.searchParams.set("sort[Arrival_Date]", "desc");

  // Apply district filter when provided
  if (district) {
    url.searchParams.set("filters[District]", district);
  }

  // Apply crop filter when provided
  if (crop) {
    url.searchParams.set("filters[Commodity]", crop);
  }

  try {
    const response = await fetch(url.toString(), {
      cache: "no-store",
      signal: AbortSignal.timeout(20000),
    });

    const data = await response.json();

    if (!response.ok || data.status === "error") {
      console.error("Government API error:", {
        status: response.status,
        message: data.message,
      });

      return NextResponse.json(
        {
          success: false,
          error: "Government API request failed.",
        },
        { status: 502 }
      );
    }

    if (!Array.isArray(data.records)) {
      return NextResponse.json(
        {
          success: false,
          error: "Unexpected government API response.",
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      source: "data.gov.in",
      state: "Punjab",
      filters: {
        district: district || "All districts",
        crop: crop || "All crops",
      },
      total: data.total ?? null,
      count: data.records.length,
      limit,
      offset,
      records: data.records,
    });
  } catch (error) {
    console.error("Test API error:", error.message);

    return NextResponse.json(
      {
        success: false,
        error:
          error.name === "TimeoutError"
            ? "Government API request timed out."
            : "Unable to fetch government mandi records.",
      },
      { status: 502 }
    );
  }
}
