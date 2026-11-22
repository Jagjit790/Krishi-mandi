import { NextResponse } from "next/server";
import { districts, seasons, soils, waterLevels } from "../../../lib/crop-data";
import { getCropSuggestions } from "../../../lib/crop-suggestions";

const isAllowed = (list, value) => list.some((item) => item.value === value);

export async function GET(request) {
  const params = new URL(request.url).searchParams;

  const district = params.get("district")?.trim() || "";
  const season = params.get("season")?.trim() || "";
  const soil = params.get("soil")?.trim() || "auto";
  const water = params.get("water")?.trim() || "";

  if (!district || !season || !water) {
    return NextResponse.json(
      {
        success: false,
        error: "Please choose your district, season and water availability.",
      },
      { status: 400 }
    );
  }

  if (
    !districts.includes(district) ||
    !isAllowed(seasons, season) ||
    !isAllowed(soils, soil) ||
    !isAllowed(waterLevels, water)
  ) {
    return NextResponse.json(
      { success: false, error: "One of the selected options is not valid." },
      { status: 400 }
    );
  }

  const { usedSoil, soilAssumed, suggestions } = getCropSuggestions({
    district,
    season,
    soil,
    water,
  });

  return NextResponse.json({
    success: true,
    filters: { district, season, soil: usedSoil, water },
    soilAssumed,
    total: suggestions.length,
    suggestions,
  });
}