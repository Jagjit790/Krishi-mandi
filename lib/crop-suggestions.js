import { crops, seasons, soils, districtSoilHint } from "./crop-data";

const WATER_RANK = { low: 1, medium: 2, high: 3 };

const WATER_TEXT = {
  low: "little",
  medium: "moderate",
  high: "plenty of",
};

function shortLabel(list, value) {
  const label = list.find((item) => item.value === value)?.label || value;
  return label.split(" (")[0];
}

function fitLabel(score) {
  if (score >= 80) return "Strong match";
  if (score >= 60) return "Good match";
  return "Limited match";
}

/**
 * Rule-based crop matching.
 * Score (max 100): season 40 + soil 30 + water 20 + district 10.
 * Crops outside the chosen season are skipped.
 */
export function getCropSuggestions({ district, season, soil, water }) {
  const usedSoil = soil === "auto" ? districtSoilHint[district] || "loam" : soil;
  const soilName = shortLabel(soils, usedSoil).toLowerCase();
  const seasonName = shortLabel(seasons, season);

  const suggestions = [];

  for (const crop of crops) {
    if (!crop.seasons.includes(season)) continue;

    let score = 40;
    const reasons = [`Grown in the ${seasonName} season`];
    const cautions = [];

    // Soil
    if (crop.soils.includes(usedSoil)) {
      score += 30;
      reasons.push(`Suits ${soilName} soil`);
    } else {
      const better = crop.soils
        .map((s) => shortLabel(soils, s).toLowerCase())
        .join(" or ");
      cautions.push(
        `${soilName} soil is not ideal. This crop does best in ${better} soil.`
      );
    }

    // Water
    const gap = WATER_RANK[crop.water] - WATER_RANK[water];
    if (gap <= 0) {
      score += 20;
      reasons.push(
        crop.water === "low"
          ? "Needs little irrigation"
          : `Your water supply covers its ${crop.water} water need`
      );
    } else if (gap === 1) {
      score += 8;
      cautions.push("Needs more water than you have. Plan extra irrigation.");
    } else {
      cautions.push(
        `Needs ${WATER_TEXT[crop.water]} water, which is much more than you have available.`
      );
    }

    // District
    if (crop.bestDistricts.includes(district)) {
      score += 10;
      reasons.push(`Commonly grown in ${district}`);
    }

    suggestions.push({
      id: crop.id,
      name: crop.name,
      hindiName: crop.hindiName,
      mandiName: crop.mandiName,
      score,
      fit: fitLabel(score),
      duration: crop.duration,
      sowing: crop.sowing,
      note: crop.note,
      reasons,
      cautions,
    });
  }

  suggestions.sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));

  return {
    usedSoil,
    soilAssumed: soil === "auto",
    suggestions,
  };
}