
import { NextResponse } from "next/server";

import {
  districts,
  districtAliases,
} from "@/lib/constants/districts";

function matchDistrict(value) {
  if (!value) return null;

  const normalized = value
    .replace(/\s+district$/i, "")
    .trim()
    .toLowerCase();

  const alias = districtAliases[normalized];
  if (alias) return alias;

  return districts.find(
    (district) => district.toLowerCase() === normalized
  ) || null;
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);

  const lat = Number(searchParams.get("lat"));
  const lon = Number(searchParams.get("lon"));

  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lon) ||
    lat < -90 || lat > 90 ||
    lon < -180 || lon > 180
  ) {
    return NextResponse.json(
      { success: false, error: "Invalid location coordinates." },
      { status: 400 }
    );
  }

  try {
    const url = new URL(
      "https://nominatim.openstreetmap.org/reverse"
    );

    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("lat", String(lat));
    url.searchParams.set("lon", String(lon));
    url.searchParams.set("zoom", "10");
    url.searchParams.set("addressdetails", "1");

    const response = await fetch(url.toString(), {
      headers: {
        "User-Agent": "KrishiSaathi/1.0",
        "Accept-Language": "en",
      },
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      throw new Error("Location service unavailable.");
    }

    const data = await response.json();
    const address = data.address || {};

    if (address.state && !address.state.toLowerCase().includes("punjab")) {
      return NextResponse.json(
        {
          success: false,
          error: "Your detected location is outside Punjab.",
        },
        { status: 422 }
      );
    }

    const possibleDistrict =
    address.state_district ||
    address.district ||
    address.county;

    const district = matchDistrict(possibleDistrict);

    if (!district) {
      return NextResponse.json(
        {
          success: false,
          error: "Could not identify your Punjab district. Please select it manually.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      district,
    });

  } catch (error) {
    console.error("District detection error:", error.message);

    return NextResponse.json(
      {
        success: false,
        error: "Unable to detect your district. Please select it manually.",
      },
      { status: 502 }
    );
  }
}
