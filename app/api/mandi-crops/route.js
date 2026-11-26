import { NextResponse } from "next/server";

const PAGE_LIMIT = 1000;
const DAYS_BACK = 60;
const CACHE_TTL = 6 * 60 * 60 * 1000;
const REQUEST_TIMEOUT = 20000;

const cropsCache = new Map();
const pendingRequests = new Map();

// Convert API dates into YYYY-MM-DD format
function normalizeDate(value) {
  if (!value) return null;

  const date = String(value).trim();

  // Format: DD/MM/YYYY
  const slashMatch = date.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);

  if (slashMatch) {
    const [, day, month, year] = slashMatch;
    return `${year}-${month}-${day}`;
  }

  // Format: YYYY-MM-DD
  const isoMatch = date.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (isoMatch) {
    return date;
  }

  return null;
}

// Get today's date in India
function getIndiaDate() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function getCutoffDate() {
  const today = getIndiaDate();
  const [year, month, day] = today.split("-").map(Number);

  const cutoff = new Date(
    Date.UTC(year, month - 1, day - DAYS_BACK)
  );

  return cutoff.toISOString().slice(0, 10);
}

async function fetchDistrictCrops(apiKey, resourceId, district) {
  const uniqueCrops = new Map();

  const cutoffDate = getCutoffDate();

  let offset = 0;
  let totalRecords = null;
  let reachedCutoff = false;

  while (!reachedCutoff) {
    const url = new URL(
      `https://api.data.gov.in/resource/${encodeURIComponent(resourceId)}`
    );

    url.searchParams.set("api-key", apiKey);
    url.searchParams.set("format", "json");
    url.searchParams.set("limit", String(PAGE_LIMIT));
    url.searchParams.set("offset", String(offset));

    url.searchParams.set("filters[State]", "Punjab");
    url.searchParams.set("filters[District]", district);

    url.searchParams.set("sort[Arrival_Date]", "desc");

    const response = await fetch(url.toString(), {
      cache: "no-store",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT),
    });

    if (!response.ok) {
      throw new Error(
        `Government API returned status ${response.status}`
      );
    }

    const data = await response.json();

    if (data.status === "error" || !Array.isArray(data.records)) {
      throw new Error("Invalid government API response.");
    }

    if (totalRecords === null) {
      totalRecords = Number(data.total);

      if (!Number.isFinite(totalRecords) || totalRecords < 0) {
        throw new Error("Invalid total record count.");
      }
    }

    if (data.records.length === 0) {
      break;
    }

    let oldestDateInPage = null;

    for (const record of data.records) {
      const arrivalDate = normalizeDate(record.Arrival_Date);

      if (arrivalDate) {
        if (!oldestDateInPage || arrivalDate < oldestDateInPage) {
          oldestDateInPage = arrivalDate;
        }

        // Ignore records older than our 60-day window
        if (arrivalDate < cutoffDate) {
          continue;
        }
      }

      const code = record.Commodity_Code;
      const name = record.Commodity?.trim();

      if (code === undefined || code === null || !name) {
        continue;
      }

      const normalizedCode = String(code).trim();

      if (!normalizedCode) continue;

      if (!uniqueCrops.has(normalizedCode)) {
        uniqueCrops.set(normalizedCode, {
          code: normalizedCode,
          name,
        });
      }
    }

    offset += data.records.length;

    // Stop when the page has reached dates older than our window
    if (oldestDateInPage && oldestDateInPage < cutoffDate) {
      reachedCutoff = true;
    }

    if (offset >= totalRecords) {
      break;
    }
  }

  const crops = Array.from(uniqueCrops.values()).sort((a, b) =>
    a.name.localeCompare(b.name, undefined, {
      sensitivity: "base",
    })
  );

  return {
  success: true,
  district,
  periodDays: DAYS_BACK,
  total: crops.length,
  rawRecordsTotal: totalRecords,
  uniqueCrops: crops.length,
  crops,
  source: "data.gov.in",
};
}


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
  const district = searchParams.get("district")?.trim() || "";

  if (!district) {
    return NextResponse.json(
      {
        success: false,
        error: "Please select a district.",
      },
      { status: 400 }
    );
  }

  if (district.length > 80) {
    return NextResponse.json(
      {
        success: false,
        error: "District name is too long.",
      },
      { status: 400 }
    );
  }

  const cacheKey = district.toLowerCase();

  // 1. Return cached data if still valid
  const cached = cropsCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return NextResponse.json({
      ...cached.data,
      cached: true,
      stale: false,
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
          error: "Unable to fetch crops for this district.",
        },
        { status: 502 }
      );
    }
  }

  // 3. Fetch fresh data
  const fetchPromise = fetchDistrictCrops(
    apiKey,
    resourceId,
    district
  );

  pendingRequests.set(cacheKey, fetchPromise);

  try {
    const data = await fetchPromise;

    cropsCache.set(cacheKey, {
      data,
      timestamp: Date.now(),
    });

    return NextResponse.json({
      ...data,
      cached: false,
      stale: false,
      fetchedAt: new Date().toISOString(),
    });
  } } catch (error) {
  console.error("Crop API detailed error:", {
    name: error.name,
    message: error.message,
    cause: error.cause,
    causeMessage: error.cause?.message,
    code: error.cause?.code,
    stack: error.stack,
  });

  if (cached) {
    return NextResponse.json({
      ...cached.data,
      cached: true,
      stale: true,
    });
  }

  return NextResponse.json(
    {
      success: false,
      error: error.message,
      errorName: error.name,
      cause: error.cause?.message || null,
      code: error.cause?.code || null,
    },
    { status: 502 }
  );
} finally {
  pendingRequests.delete(cacheKey);
}

}

