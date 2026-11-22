
import { NextResponse } from "next/server";

const USER_AGENT =
  "KrishiSaathiMandiFinder/1.0 (student project)";

const geocodeCache = new Map();
let lastNominatimRequestAt = 0;

const NOMINATIM_TIMEOUT = 15000;
const OSRM_TIMEOUT = 20000;

const sleep = (ms) =>
  new Promise((resolve) => setTimeout(resolve, ms));

async function waitForNominatim() {
  const delay = Math.max(
    0,
    1100 - (Date.now() - lastNominatimRequestAt)
  );

  if (delay > 0) await sleep(delay);

  lastNominatimRequestAt = Date.now();
}

function parseCoordinates(value) {
  const match = String(value || "").match(
    /^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/
  );

  if (!match) return null;

  const lat = Number(match[1]);
  const lon = Number(match[2]);

  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lon) ||
    lat < -90 ||
    lat > 90 ||
    lon < -180 ||
    lon > 180
  ) {
    return null;
  }

  return { lat, lon };
}

function normalizeKey(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function simplifyPlaceName(value) {
  return String(value || "")
    .replace(
      /\b(agricultural produce market committee|apmc|market yard|mandi|market)\b/gi,
      " "
    )
    .replace(/[(),-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Search specific market-yard names before trying general place names.
// These are search alternatives, not assumed coordinates.
function getMarketSearchNames(place) {
  const key = normalizeKey(place);

  if (key.includes("tanda") && key.includes("urmur")) {
    return [
      "Dana Mandi, Urmar Tanda",
      "Tanda Urmur APMC",
      "Tanda Urmar, Hoshiarpur",
    ];
  }

  if (key.includes("kotfatuhi") || key.includes("kot fatuhi")) {
    return [
      "Dana Mandi, Kot Fatuhi",
      "Kot Fatuhi APMC",
      "Kot Fatuhi, Garhshankar",
    ];
  }

  if (key.includes("mahalpur") || key.includes("mahilpur")) {
    return [
      "Dana Mandi, Mahilpur",
      "Garh Shankar Mahalpur APMC",
      "Mahilpur, Hoshiarpur",
    ];
  }

  if (key.includes("garh") && key.includes("shankar")) {
    return [
      "Dana Mandi, Garhshankar",
      "Garh Shankar APMC",
      "Garhshankar, Hoshiarpur",
    ];
  }

  if (key.includes("dasuya")) {
    return [
      "Dana Mandi, Dasuya",
      "Sabzi Mandi and Grain Market, Dasuya",
      "Dasuya APMC",
    ];
  }

  return [];
}

async function nominatimRequest(url) {
  let lastError;

  // Retry once on a temporary connection failure.
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      await waitForNominatim();

      const response = await fetch(url, {
        headers: {
          "User-Agent": USER_AGENT,
          "Accept-Language": "en",
        },
        cache: "no-store",
        signal: AbortSignal.timeout(NOMINATIM_TIMEOUT),
      });

      if (!response.ok) {
        throw new Error(
          `Location service returned HTTP ${response.status}.`
        );
      }

      return await response.json();
    } catch (error) {
      lastError = error;

      if (attempt === 0) {
        await sleep(1200);
      }
    }
  }

  throw new Error(
    `Map lookup failed: ${lastError?.message || "Unknown network error"}`
  );
}

async function searchPlace(query) {
  const url = new URL(
    "https://nominatim.openstreetmap.org/search"
  );

  url.searchParams.set("q", query);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "1");
  url.searchParams.set("countrycodes", "in");

  const data = await nominatimRequest(url.toString());

  if (!Array.isArray(data) || data.length === 0) {
    return null;
  }

  const lat = Number(data[0].lat);
  const lon = Number(data[0].lon);

  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lon) ||
    lat < -90 ||
    lat > 90 ||
    lon < -180 ||
    lon > 180
  ) {
    return null;
  }

  return {
    lat,
    lon,
    displayName: data[0].display_name || query,
  };
}

async function geocodePlace(place, district = "") {
  const cleanPlace = String(place || "").trim();
  const cleanDistrict = String(district || "").trim();

  if (!cleanPlace) return null;

  const coordinates = parseCoordinates(cleanPlace);
  if (coordinates) return coordinates;

  const cacheKey = normalizeKey(
    `${cleanPlace}, ${cleanDistrict}, Punjab, India`
  );

  if (geocodeCache.has(cacheKey)) {
    return geocodeCache.get(cacheKey);
  }

  const specialNames = getMarketSearchNames(cleanPlace);
  const simplified = simplifyPlaceName(cleanPlace);

  const names = [
    ...specialNames,
    simplified,
    cleanPlace,
  ].filter(Boolean);

  const queries = [];

  for (const name of [...new Set(names)]) {
    queries.push(
      [name, cleanDistrict, "Punjab", "India"]
        .filter(Boolean)
        .join(", ")
    );

    queries.push(`${name}, Punjab, India`);
  }

  // If a market includes a sub-location in parentheses,
  // search that location separately.
  const bracketMatch = cleanPlace.match(/\(([^)]+)\)/);

  if (bracketMatch?.[1]) {
    queries.push(
      `${bracketMatch[1].trim()}, ${cleanDistrict}, Punjab, India`
    );
  }

  let lastNetworkError = null;

  for (const query of [...new Set(queries)]) {
    try {
      const result = await searchPlace(query);

      if (result) {
        geocodeCache.set(cacheKey, result);
        return result;
      }
    } catch (error) {
      lastNetworkError = error;

      // Stop further searches if the map service is failing.
      // Repeatedly querying a broken service won't help.
      break;
    }
  }

  if (lastNetworkError) {
    throw new Error(
      `Could not look up "${cleanPlace}": ${lastNetworkError.message}`
    );
  }

  // Do not cache unsuccessful searches.
  // A later request may succeed or use a corrected name.
  return null;
}

async function reverseGeocode(lat, lon) {
  const url = new URL(
    "https://nominatim.openstreetmap.org/reverse"
  );

  url.searchParams.set("lat", String(lat));
  url.searchParams.set("lon", String(lon));
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("zoom", "10");
  url.searchParams.set("addressdetails", "1");

  const data = await nominatimRequest(url.toString());
  const address = data.address || {};

  const locality =
    address.village ||
    address.hamlet ||
    address.town ||
    address.city ||
    address.municipality ||
    address.suburb ||
    address.county ||
    "";

  const district =
    address.state_district ||
    address.district ||
    "";

  const locationName = [locality, district]
    .filter(Boolean)
    .filter(
      (value, index, values) =>
        values.findIndex(
          (item) =>
            item.toLowerCase() === value.toLowerCase()
        ) === index
    )
    .join(", ");

  return {
    locationName: locationName || data.display_name || "",
    lat,
    lon,
  };
}

async function getRoadRoute(start, destination) {
  const url =
    "https://router.project-osrm.org/route/v1/driving/" +
    `${start.lon},${start.lat};${destination.lon},${destination.lat}` +
    "?overview=false";

  let lastError;

  // Retry a transient OSRM failure once.
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent": USER_AGENT,
        },
        cache: "no-store",
        signal: AbortSignal.timeout(OSRM_TIMEOUT),
      });

      if (!response.ok) {
        throw new Error(
          `Road-routing service returned HTTP ${response.status}.`
        );
      }

      const data = await response.json();
      const route = data.routes?.[0];

      if (
        data.code !== "Ok" ||
        !route ||
        !Number.isFinite(route.distance) ||
        !Number.isFinite(route.duration) ||
        route.distance <= 0
      ) {
        throw new Error(
          data.message || "No usable road route was found."
        );
      }

      const distanceKm = route.distance / 1000;

      return {
        distanceKm,
        durationMinutes: route.duration / 60,
        roundTripKm: distanceKm * 2,
        destinationName: destination.displayName || "",
      };
    } catch (error) {
      lastError = error;

      if (attempt === 0) {
        await sleep(700);
      }
    }
  }

  throw new Error(
    lastError?.message || "Road route could not be calculated."
  );
}

export async function POST(request) {
  try {
    const body = await request.json();

    // ACTION 1: GPS coordinates to a readable location.
    if (body.action === "reverseGeocode") {
      const coordinates = parseCoordinates(body.origin);

      if (!coordinates) {
        return NextResponse.json(
          {
            success: false,
            error: "Valid GPS coordinates are required.",
          },
          { status: 400 }
        );
      }

      const location = await reverseGeocode(
        coordinates.lat,
        coordinates.lon
      );

      return NextResponse.json({
        success: true,
        location,
      });
    }

    // ACTION 2: Calculate road routes to mandis.
    const origin = String(body.origin || "").trim();
    const district = String(body.district || "").trim();
    const markets = body.markets;

    if (!origin) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Enter your village or fetch your GPS location.",
        },
        { status: 400 }
      );
    }

    if (
      !Array.isArray(markets) ||
      markets.length === 0 ||
      markets.length > 50
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Provide between 1 and 50 mandi names.",
        },
        { status: 400 }
      );
    }

    const start =
      parseCoordinates(origin) ||
      (await geocodePlace(origin, district));

    if (!start) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Starting location not found. Try a more specific village or GPS location.",
        },
        { status: 400 }
      );
    }

    const routes = {};
    const unavailable = [];
    const routeErrors = {};

    // Keep requests sequential to respect the geocoding service.
    for (const rawMarket of markets) {
      const market = String(rawMarket || "").trim();

      if (!market) continue;

      try {
        const destination = await geocodePlace(
          market,
          district
        );

        if (!destination) {
          unavailable.push(market);
          routeErrors[market] =
            `Could not find "${market}" or its alternate search names on the map.`;
          continue;
        }

        routes[market] = await getRoadRoute(start, destination);
      } catch (error) {
        unavailable.push(market);
        routeErrors[market] =
          error.message || "Unable to calculate the road route.";
      }
    }

    const routeCount = Object.keys(routes).length;

    return NextResponse.json({
      success: true,
      routes,
      unavailable,
      routeErrors,
      routeCount,
      requestedCount: markets.length,
      origin: {
        lat: start.lat,
        lon: start.lon,
      },
      message:
        routeCount > 0
          ? `Road routes found for ${routeCount} of ${markets.length} mandis.`
          : "No road routes could be calculated. Check the connection or enter transport costs manually.",
    });
  } catch (error) {
    console.error("Mandi routes API error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error.message ||
          "Unable to calculate mandi routes. Please try again.",
      },
      { status: 500 }
    );
  }
}
