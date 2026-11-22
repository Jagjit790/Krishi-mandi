"use client";

import Link from "next/link";
import { useState } from "react";
import { districts, seasons, soils, waterLevels } from "../../lib/crop-data";

const selectClass =
  "min-h-12 w-full rounded-xl border border-[#DCE4D6] bg-[#F5F1E6] px-4 text-[#203B2B] outline-none focus:ring-2 focus:ring-[#A9C5A0]";

function Field({ label, htmlFor, children }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-2 block text-sm font-semibold">
        {label}
      </label>
      {children}
    </div>
  );
}

function CropCard({ crop, district }) {
  const strong = crop.score >= 80;

  // Opens the mandi page with the crop and district already filled in.
  const mandiParams = new URLSearchParams({ district });
  if (crop.mandiName) mandiParams.set("crop", crop.mandiName);
  const mandiHref = `/mandi-prices?${mandiParams.toString()}`;

  return (
    <article className="rounded-2xl border border-[#DCE4D6] bg-white p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-xl font-semibold">
            {crop.name}{" "}
            <span className="text-base font-normal text-[#718071]">
              {crop.hindiName}
            </span>
          </h3>
          <p className="mt-1 text-sm text-[#607064]">
            {crop.duration} · Sow: {crop.sowing}
          </p>
        </div>

        <span
          className={`rounded-full px-3 py-1 text-sm font-semibold ${
            strong ? "bg-[#245B3F] text-white" : "bg-[#E8EFE3] text-[#203B2B]"
          }`}
        >
          {crop.fit} · {crop.score}%
        </span>
      </div>

      <div
        className="mt-4 h-2 overflow-hidden rounded-full bg-[#E8EFE3]"
        role="presentation"
      >
        <div
          className="h-full rounded-full bg-[#56815D]"
          style={{ width: `${crop.score}%` }}
        />
      </div>

      <ul className="mt-4 space-y-1.5 text-sm leading-6">
        {crop.reasons.map((reason) => (
          <li key={reason} className="flex gap-2">
            <span className="text-[#245B3F]" aria-hidden="true">
              ✓
            </span>
            <span>{reason}</span>
          </li>
        ))}
        {crop.cautions.map((caution) => (
          <li key={caution} className="flex gap-2 text-[#8A5A12]">
            <span aria-hidden="true">⚠</span>
            <span>{caution}</span>
          </li>
        ))}
      </ul>

      <p className="mt-4 rounded-xl bg-[#F5F1E6] p-3 text-sm leading-6 text-[#526653]">
        {crop.note}
      </p>

      <Link
        href={mandiHref}
        className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#245B3F] hover:underline"
      >
        Check mandi prices →
      </Link>
    </article>
  );
}

export default function CropSuggestionForm() {
  const [district, setDistrict] = useState("");
  const [season, setSeason] = useState("");
  const [soil, setSoil] = useState("auto");
  const [water, setWater] = useState("");

  const [loading, setLoading] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  function detectDistrict() {
    if (!navigator.geolocation) {
      setError("Your browser cannot detect location. Please select your district.");
      return;
    }

    setError("");
    setDetecting(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const params = new URLSearchParams({
            lat: String(position.coords.latitude),
            lon: String(position.coords.longitude),
          });

          const response = await fetch(`/api/location-district?${params}`);
          const data = await response.json();

          if (!response.ok || !data.success) {
            throw new Error(data.error || "Unable to detect your district.");
          }

          setDistrict(data.district);
        } catch (err) {
          setError(err.message || "Unable to detect your district.");
        } finally {
          setDetecting(false);
        }
      },
      () => {
        setError("Location permission was denied. Please select your district.");
        setDetecting(false);
      },
      { timeout: 10000 }
    );
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setResult(null);

    if (!district || !season || !water) {
      setError("Please choose your district, season and water availability.");
      return;
    }

    setLoading(true);

    try {
      const params = new URLSearchParams({ district, season, soil, water });
      const response = await fetch(`/api/crop-suggestions?${params}`);
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Unable to get suggestions. Please try again.");
      }

      setResult(data);
    } catch (err) {
      setError(err.message || "Unable to get suggestions. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const soilLabel = result
    ? soils.find((s) => s.value === result.filters.soil)?.label
    : "";

  return (
    <div className="mt-10">
      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-[#DCE4D6] bg-white p-5 sm:p-7"
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="District" htmlFor="district">
            <div className="flex gap-2">
              <select
                id="district"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className={selectClass}
              >
                <option value="">Select district</option>
                {districts.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={detectDistrict}
                disabled={detecting}
                className="min-h-12 shrink-0 rounded-xl border border-[#DCE4D6] px-4 text-sm font-semibold transition-colors hover:bg-[#E5EBDD] disabled:cursor-wait disabled:opacity-60"
              >
                {detecting ? "Detecting…" : "📍 Detect"}
              </button>
            </div>
          </Field>

          <Field label="Season" htmlFor="season">
            <select
              id="season"
              value={season}
              onChange={(e) => setSeason(e.target.value)}
              className={selectClass}
            >
              <option value="">Select season</option>
              {seasons.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Soil type" htmlFor="soil">
            <select
              id="soil"
              value={soil}
              onChange={(e) => setSoil(e.target.value)}
              className={selectClass}
            >
              {soils.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Water availability" htmlFor="water">
            <select
              id="water"
              value={water}
              onChange={(e) => setWater(e.target.value)}
              className={selectClass}
            >
              <option value="">Select water availability</option>
              {waterLevels.map((w) => (
                <option key={w.value} value={w.value}>
                  {w.label}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-6 min-h-12 w-full rounded-xl bg-[#245B3F] px-8 font-semibold text-white transition hover:bg-[#203B2B] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#245B3F] disabled:cursor-wait disabled:opacity-60 sm:w-auto"
        >
          {loading ? "Finding crops…" : "Find suitable crops"}
        </button>
      </form>

      {error && (
        <p
          role="alert"
          className="mt-6 rounded-xl border border-[#E8C9A8] bg-[#FBF1E4] p-4 text-sm text-[#8A5A12]"
        >
          {error}
        </p>
      )}

      {result && (
        <section className="mt-10" aria-live="polite">
          <h2 className="text-2xl font-semibold tracking-tight">
            {result.total} crops for {result.filters.district}
          </h2>

          {result.soilAssumed && (
            <p className="mt-2 text-sm leading-6 text-[#607064]">
              You were not sure of your soil, so we assumed{" "}
              {soilLabel?.toLowerCase()}, which is typical for your district. A
              soil test will give a more accurate result.
            </p>
          )}

          {result.total === 0 ? (
            <p className="mt-5 rounded-xl bg-white p-5 text-sm text-[#607064]">
              No crops found for these choices. Try a different season.
            </p>
          ) : (
            <div className="mt-6 grid gap-5 lg:grid-cols-2">
              {result.suggestions.map((crop) => (
                <CropCard
                  key={crop.id}
                  crop={crop}
                  district={result.filters.district}
                />
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}