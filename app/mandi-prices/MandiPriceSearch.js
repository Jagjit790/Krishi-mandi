
"use client";

import { useState } from "react";

const districts = [
  "Amritsar",
  "Barnala",
  "Bathinda",
  "Faridkot",
  "Fatehgarh Sahib",
  "Fazilka",
  "Ferozpur",
  "Gurdaspur",
  "Hoshiarpur",
  "Jalandhar",
  "Kapurthala",
  "Ludhiana",
  "Malerkotla",
  "Mansa",
  "Moga",
  "Pathankot",
  "Patiala",
  "Rupnagar",
  "Sangrur",
  "SAS Nagar",
  "Shaheed Bhagat Singh Nagar",
  "Sri Muktsar Sahib",
  "Tarn Taran",
];

function formatPrice(value) {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  const number = Number(value);

  return Number.isFinite(number)
    ? `₹${number.toLocaleString("en-IN")}`
    : "—";
}


function parseArrivalDate(value) {
  if (!value) return null;

  const parts = value.split("/");

  if (parts.length !== 3) return null;

  const [day, month, year] = parts;

  const date = new Date(
    Number(year),
    Number(month) - 1,
    Number(day)
  );

  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDate(date) {
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}


export default function MandiPriceSearch() {
  const [crop, setCrop] = useState("");
  const [district, setDistrict] = useState("");
  const [records, setRecords] = useState([]);
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");
  const [total, setTotal] = useState(null);
  const [locationMessage, setLocationMessage] = useState("");

  async function searchPrices(searchCrop = crop.trim(), searchDistrict = district) {
    if (!searchCrop || !searchDistrict) {
      setStatus("error");
      setMessage("Please select both a crop and a district.");
      setRecords([]);
      return;
    }

    setStatus("loading");
    setMessage("");
    setLocationMessage("");
    setRecords([]);
    setTotal(null);

    const params = new URLSearchParams();

    if (searchCrop) params.set("crop", searchCrop);
    if (searchDistrict) params.set("district", searchDistrict);

    try {
      const response = await fetch(
        `/api/mandi-prices?${params.toString()}`
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Unable to load market prices.");
      }

      setRecords(data.records || []);
      setTotal(data.total ?? null);
      setStatus(data.records?.length ? "success" : "empty");

      if (!data.records?.length) {
        setMessage(
          "No matching records were returned. Try another crop or district."
        );
      }
    } catch (error) {
      setStatus("error");
      setMessage(error.message || "Something went wrong. Please try again.");
    }
  }

  function handleSearch(event) {
    event.preventDefault();
    searchPrices();
  }

  
async function handleLocationSearch() {
  if (!navigator.geolocation) {
    setLocationMessage(
      "Location is not supported by this browser. Please select your district manually."
    );
    return;
  }

  setLocationMessage("Detecting your district...");

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      try {
        const { latitude, longitude } = position.coords;

        const response = await fetch(
          `/api/location-district?lat=${latitude}&lon=${longitude}`
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.error || "Unable to identify your district."
          );
        }

        const detectedDistrict = data.district;

        // Automatically select the detected district.
        setDistrict(detectedDistrict);

        setLocationMessage(
          `Your location was detected: ${detectedDistrict}, Punjab.`
        );

       
        setLocationMessage(
          `Select crop to search for`
        );

      } catch (error) {
        setLocationMessage(
          error.message ||
          "Unable to detect your district. Please select it manually."
        );
      }
    },

    (error) => {
      if (error.code === 1) {
        setLocationMessage(
          "Location permission denied. Please select your district manually."
        );
      } else {
        setLocationMessage(
          "Unable to get your location. Please try again or select your district manually."
        );
      }
    },

    {
      enableHighAccuracy: false,
      timeout: 15000,
      maximumAge: 300000,
    }
  );
}


// Select the crop to display.
// If the user hasn't entered one, use the first returned crop.
const selectedCrop =
  crop.trim() || records[0]?.Commodity || "";

const cropRecords = records.filter(
  (record) =>
    record.Commodity?.toLowerCase() ===
    selectedCrop.toLowerCase()
);

// Compare modal prices across markets.
const mandiMap = new Map();

cropRecords.forEach((record) => {
  const market = record.Market || "Unknown market";
  const price = Number(record.Modal_Price);

  if (!Number.isFinite(price)) return;

  const existing = mandiMap.get(market) || {
    total: 0,
    count: 0,
  };

  existing.total += price;
  existing.count += 1;

  mandiMap.set(market, existing);
});

const mandiComparisons = Array.from(mandiMap.entries())
  .map(([name, item]) => ({
    name,
    price: Math.round(item.total / item.count),
  }))
  .sort((a, b) => b.price - a.price);

// Build a trend from actual arrival dates.
const trendMap = new Map();

cropRecords.forEach((record) => {
  const date = parseArrivalDate(record.Arrival_Date);
  const price = Number(record.Modal_Price);

  if (!date || !Number.isFinite(price)) return;

  const key = date.toISOString().slice(0, 10);

  const existing = trendMap.get(key) || {
    date,
    total: 0,
    count: 0,
  };

  existing.total += price;
  existing.count += 1;

  trendMap.set(key, existing);
});

const trendData = Array.from(trendMap.values())
  .map((item) => ({
    date: item.date,
    price: Math.round(item.total / item.count),
  }))
  .sort((a, b) => a.date - b.date)
  .slice(-7);

const trendMax = Math.max(
  1,
  ...trendData.map((item) => item.price)
);

const latestDate = cropRecords
  .map((record) => parseArrivalDate(record.Arrival_Date))
  .filter(Boolean)
  .sort((a, b) => b - a)[0];


  return (
    <>
      {/* Location section */}
      <section className="mt-8 rounded-2xl border border-[#DCE4D6] bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-start gap-3">
          <span className="text-2xl" aria-hidden="true">📍</span>
          <div>
            <h2 className="text-lg font-semibold">Choose your location</h2>
            <p className="mt-1 text-sm leading-6 text-[#607064]">
              Search a district directly or use your location to help find
              markets near you.
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <button
            type="button"
            onClick={handleLocationSearch}
            className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#245B3F] px-5 py-3 font-semibold text-white transition hover:bg-[#203B2B] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#245B3F]"
          >
            <span aria-hidden="true">◎</span>
            Use my current location
          </button>

          <label className="flex flex-col gap-2 text-sm font-medium">
            Select district 
            <select
              value={district}
              onChange={(event) => setDistrict(event.target.value)}
              className="min-h-12 rounded-xl border border-[#DCE4D6] bg-[#F5F1E6] px-4 text-[#203B2B] outline-none focus:ring-2 focus:ring-[#A9C5A0]"
            required>
              <option value="">All Punjab districts</option>
              {districts.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </label>
        </div>

        {locationMessage && (
          <p role="status" className="mt-4 text-sm leading-6 text-[#607064]">
            {locationMessage}
          </p>
        )}
      </section>

      {/* Search section */}
      <form onSubmit={handleSearch} className="mt-8">
        <label htmlFor="crop-search" className="mb-3 block text-lg font-semibold">
          Which crop are you looking for?
        </label>

        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            id="crop-search"
            type="search"
            value={crop}
            onChange={(event) => setCrop(event.target.value)}
            placeholder="Search crops, e.g. potato, onion"
            maxLength={80}
            className="min-h-14 w-full rounded-xl border border-[#DCE4D6] bg-white px-5 text-base outline-none placeholder:text-[#89948A] focus:ring-2 focus:ring-[#A9C5A0] sm:flex-1"
          required/>

          <button
            type="submit"
            disabled={status === "loading"}
            className="min-h-14 rounded-xl bg-[#245B3F] px-8 font-semibold text-white transition hover:bg-[#203B2B] disabled:cursor-wait disabled:opacity-60"
          >
            {status === "loading" ? "Searching…" : "Search prices"}
          </button>
        </div>
      </form>

      {/* Results */}
      
{/* Farmer Dashboard */}
<section className="mt-12 space-y-8">

  {/* Your area */}
  <div className="rounded-2xl border border-[#DCE4D6] bg-white p-5 sm:p-6">
    <div className="flex items-center gap-3">
      <span className="text-2xl">📍</span>

      <div>
        <p className="text-sm text-[#607064]">Your area</p>

        <h2 className="text-xl font-bold">
          {district || "Punjab"}
        </h2>
      </div>
    </div>
  </div>

  {status === "idle" && (
    <div className="rounded-2xl border border-dashed border-[#B8C9B2] bg-white p-10 text-center">
      <span className="text-4xl">🌱</span>

      <h3 className="mt-4 text-lg font-semibold">
        Your mandi dashboard is waiting
      </h3>

      <p className="mt-2 text-sm text-[#607064]">
        Select your location or crop and search to see
        reported market prices.
      </p>
    </div>
  )}

  {status === "loading" && (
    <div className="rounded-2xl bg-white p-8 text-center">
      <p className="text-[#607064]">
        Loading mandi prices for your area...
      </p>
    </div>
  )}

  {(status === "error" || status === "empty") && (
    <div
      role="status"
      className="rounded-xl border border-[#DCE4D6] bg-white p-5 text-[#607064]"
    >
      {message}
    </div>
  )}

  {status === "success" && (
    <>
      {/* Today's mandi prices */}
      <div>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-[#557A4D]">
              Market overview
            </p>

            <h2 className="mt-2 text-3xl font-bold">
              Today&apos;s mandi prices
            </h2>

            <p className="mt-2 text-sm text-[#607064]">
              Latest available government-reported prices.
            </p>
          </div>

          <span className="rounded-full bg-[#E5EBDD] px-3 py-2 text-xs font-semibold text-[#245B3F]">
            {district || "Punjab markets"}
          </span>
        </div>

        <div className="mt-5 rounded-2xl border border-[#DCE4D6] bg-white p-5 sm:p-7">
          <p className="text-sm text-[#607064]">
            Selected crop
          </p>

          <h3 className="mt-2 text-2xl font-bold">
            {selectedCrop} 🌾
          </h3>

          <p className="mt-1 text-sm text-[#607064]">
            Prices per quintal (100 kg)
          </p>

          {latestDate && (
            <p className="mt-3 text-xs text-[#718071]">
              Latest arrival date: {formatDate(latestDate)}
            </p>
          )}

          <div className="mt-5 grid grid-cols-3 gap-3">
            {[
              {
                label: "Minimum",
                value: cropRecords.length
                  ? Math.min(...cropRecords.map(r => Number(r.Min_Price)).filter(Number.isFinite))
                  : null,
              },
              {
                label: "Modal",
                value: cropRecords.length
                  ? Math.round(
                      cropRecords.reduce(
                        (sum, r) => sum + (Number(r.Modal_Price) || 0),
                        0
                      ) / cropRecords.length
                    )
                  : null,
              },
              {
                label: "Maximum",
                value: cropRecords.length
                  ? Math.max(...cropRecords.map(r => Number(r.Max_Price)).filter(Number.isFinite))
                  : null,
              },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-xl bg-[#F5F1E6] p-3"
              >
                <p className="text-xs text-[#607064]">
                  {item.label}
                </p>

                <p className="mt-2 text-lg font-bold text-[#245B3F]">
                  {item.value !== null && Number.isFinite(item.value)
                    ? formatPrice(item.value)
                    : "—"}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Compare mandis */}
      <div>
        <h2 className="text-2xl font-bold">
          Compare mandis
        </h2>

        <p className="mt-2 text-sm text-[#607064]">
          Compare reported modal prices for {selectedCrop} in{" "}
          {district || "Punjab"}.
        </p>

        {mandiComparisons.length >= 2 ? (
          <>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {mandiComparisons.slice(0, 2).map((mandi, index) => (
                <div
                  key={mandi.name}
                  className="rounded-2xl border border-[#DCE4D6] bg-white p-5"
                >
                  <p className="text-sm text-[#607064]">
                    {index === 0 ? "Best reported price" : "Other market"}
                  </p>

                  <h3 className="mt-2 text-lg font-semibold">
                    {mandi.name}
                  </h3>

                  <p className="mt-3 text-3xl font-bold text-[#245B3F]">
                    {formatPrice(mandi.price)}
                  </p>

                  <p className="mt-1 text-xs text-[#607064]">
                    Per quintal · Modal price
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-4 rounded-xl bg-[#E8EFE3] p-4 text-sm text-[#203B2B]">
              {mandiComparisons[0].name} reports{" "}
              {formatPrice(
                mandiComparisons[0].price -
                mandiComparisons[1].price
              )}{" "}
              more per quintal than {mandiComparisons[1].name}.
            </div>
          </>
        ) : (
          <p className="mt-4 rounded-xl bg-white p-5 text-sm text-[#607064]">
            Not enough different markets are available to compare prices yet.
          </p>
        )}
      </div>

      {/* Price trend */}
      <div>
        <h2 className="text-2xl font-bold">
          How have prices changed?
        </h2>

        <p className="mt-2 text-sm text-[#607064]">
          {selectedCrop} · Reported modal prices by arrival date
        </p>

        <div className="mt-5 rounded-2xl border border-[#DCE4D6] bg-white p-5 sm:p-7">
          {trendData.length >= 2 ? (
            <>
              <div className="flex h-52 items-end justify-around gap-3 border-b border-[#DCE4D6] pb-2">
                {trendData.map((item) => (
                  <div
                    key={item.date.toISOString()}
                    className="flex h-full flex-1 flex-col items-center justify-end gap-2"
                  >
                    <span className="text-xs font-semibold text-[#245B3F]">
                      {formatPrice(item.price)}
                    </span>

                    <div
                      className="w-full max-w-12 rounded-t-lg bg-[#78A66A]"
                      style={{
                        height: `${Math.max(
                          8,
                          (item.price / trendMax) * 125
                        )}px`,
                      }}
                      title={`${formatDate(item.date)}: ${formatPrice(item.price)}`}
                    />

                    <span className="text-center text-[10px] text-[#607064]">
                      {item.date.toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                      })}
                    </span>
                  </div>
                ))}
              </div>

              <p className="mt-4 text-xs text-[#718071]">
                Based on available government-reported records.
                Each value represents the average modal price
                of the returned records for that date.
              </p>
            </>
          ) : (
            <div className="py-8 text-center">
              <span className="text-3xl">📊</span>

              <p className="mt-3 font-semibold">
                Historical trend not available yet
              </p>

              <p className="mt-2 text-sm text-[#607064]">
                We need records from at least two different
                arrival dates to show a meaningful price trend.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Market records */}
      <div>
        <h2 className="text-2xl font-bold">
          Market records
        </h2>

        <p className="mt-2 text-sm text-[#607064]">
          {cropRecords.length} records available for {selectedCrop}.
        </p>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {cropRecords.map((record, index) => (
            <article
              key={`${record.Market}-${record.Arrival_Date}-${index}`}
              className="rounded-2xl border border-[#DCE4D6] bg-white p-5 shadow-sm"
            >
              <p className="text-sm text-[#607064]">
                {record.Market || "Market not specified"}
              </p>

              <h3 className="mt-1 text-xl font-bold">
                {record.Commodity}
              </h3>

              <p className="mt-1 text-sm text-[#607064]">
                {record.District}
                {record.Variety ? ` · ${record.Variety}` : ""}
              </p>

              <div className="mt-5 grid grid-cols-3 gap-2 border-t border-[#E8EFE3] pt-4">
                {[
                  ["Minimum", record.Min_Price],
                  ["Modal", record.Modal_Price],
                  ["Maximum", record.Max_Price],
                ].map(([label, value]) => (
                  <div key={label}>
                    <p className="text-xs text-[#607064]">
                      {label}
                    </p>

                    <p className="mt-1 font-semibold">
                      {formatPrice(value)}
                    </p>
                  </div>
                ))}
              </div>

              <p className="mt-4 rounded-lg bg-[#F5F1E6] px-3 py-2 text-xs text-[#607064]">
                Arrival date: {record.Arrival_Date || "Not provided"}
              </p>
            </article>
          ))}
        </div>
      </div>

      <p className="text-xs leading-5 text-[#718071]">
        Source: Government of India Open Government Data platform.
        Prices reflect the returned records and their reported arrival dates.
        The latest available record may not be from today.
      </p>
    </>
  )}
</section>

    </>
  );
}
