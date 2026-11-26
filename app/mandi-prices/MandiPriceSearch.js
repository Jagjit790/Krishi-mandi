
"use client";

import { useEffect, useState } from "react";
import PriceOverview from "./Components/PriceOverview";
import LocationSelector from "./Components/LocationSelector";
import CropSelector from "./Components/CropSelector";
import PriceTrendChart from "./Components/PriceTrendChart";
import MarketRecords from "./Components/MarketRecords";
import MandiComparison from "./Components/MandiComparison";

import {
  districts,
  districtApiNames,
} from "@/lib/constants/districts";

function getApiDistrict(district) {
  return districtApiNames[district] || district;
}

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
  const [crops, setCrops] = useState([]);
  const [cropsStatus, setCropsStatus] = useState("idle");
  const [cropsMessage, setCropsMessage] = useState("");
  const [records, setRecords] = useState([]);
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");
  const [total, setTotal] = useState(null);
  const [locationMessage, setLocationMessage] = useState("");

  useEffect(() => {
    // Reset previous crop selection and results
    setCrop("");
    setCrops([]);
    setCropsMessage("");
    setRecords([]);
    setTotal(null);
    setStatus("idle");
    setMessage("");

    if (!district) {
      setCropsStatus("idle");
      return;
    }

    const controller = new AbortController();

    async function fetchCrops() {
      setCropsStatus("loading");

      try {
        const params = new URLSearchParams({
          district: getApiDistrict(district),
        });

        const response = await fetch(
          `/api/mandi-crops?${params.toString()}`,
          { signal: controller.signal }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.error || "Unable to load crops for this district."
          );
        }

        setCrops(data.crops || []);
        setCropsStatus(
          data.crops?.length ? "success" : "empty"
        );

        if (!data.crops?.length) {
          setCropsMessage(
            "No crops found in recent mandi records for this district."
          );
        }
      } catch (error) {
        if (error.name === "AbortError") return;

        setCropsStatus("error");
        setCropsMessage(
          error.message || "Unable to load crops. Please try again."
        );
      }
    }

    fetchCrops();

    return () => controller.abort();
  }, [district]);

  async function searchPrices(
    searchCrop = crop.trim(),
    searchDistrict = district
  ) {
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

    if (searchDistrict) {
      params.set("district", getApiDistrict(searchDistrict));
    }

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
      setMessage(
        error.message || "Something went wrong. Please try again."
      );
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

          setDistrict(detectedDistrict);

          setLocationMessage(
            `Your location was detected: ${detectedDistrict}, Punjab.`
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
  const selectedCrop =
    crop.trim() || records[0]?.Commodity || "";

  const cropRecords = records.filter(
    (record) =>
      record.Commodity?.toLowerCase() ===
      selectedCrop.toLowerCase()
  );
  
  
  // Compare the latest reported modal price for each mandi.
  const mandiMap = new Map();

  cropRecords.forEach((record) => {
    const market = record.Market || "Unknown market";
    const price = Number(record.Modal_Price);
    const date = parseArrivalDate(record.Arrival_Date);

    if (!Number.isFinite(price) || !date) return;

    const existing = mandiMap.get(market);

    // First record for this mandi
    if (!existing) {
      mandiMap.set(market, {
        district: record.District || district || "",
        latestDate: date,
        total: price,
        count: 1,
      });

      return;
    }

    // A newer record replaces the older price
    if (date > existing.latestDate) {
      existing.latestDate = date;
      existing.total = price;
      existing.count = 1;
    }

    // If the date is the same, include the price
    else if (date.getTime() === existing.latestDate.getTime()) {
      existing.total += price;
      existing.count += 1;
    }
  });

  const mandiComparisons = Array.from(mandiMap.entries())
    .map(([name, item]) => ({
      name,
      district: item.district,
      price: Math.round(item.total / item.count),
      arrivalDate: item.latestDate,
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

  
  
const latestCropRecords = latestDate
  ? cropRecords.filter((record) => {
      const date = parseArrivalDate(record.Arrival_Date);
      return date && date.getTime() === latestDate.getTime();
    })
  : [];





  return (
    <>
      {/* Location section */}
      <LocationSelector
        district={district}
        districts={districts}
        onDistrictChange={setDistrict}
        onLocationSearch={handleLocationSearch}
        locationMessage={locationMessage}
      />

      {/* Search section */}
      <form onSubmit={handleSearch} className="mt-8">
        <label htmlFor="crop-search" className="mb-3 block text-lg font-semibold">
          Which crop are you looking for?
        </label>

        <CropSelector
          crop={crop}
          onCropChange={setCrop}
          crops={crops}
          cropsStatus={cropsStatus}
          district={district}
          status={status}
        />
      </form>

      {district && cropsStatus === "loading" && (
        <p className="mt-3 text-sm text-[#607064]" role="status">
          Fetching available crops for {district}...
        </p>
      )}

      {cropsMessage && (
        <p
          className="mt-3 text-sm text-[#607064]"
          role="status"
        >
          {cropsMessage}
        </p>
      )}

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
                    Today's mandi prices
                  </h2>

                  <p className="mt-2 text-sm text-[#607064]">
                    Latest available government-reported prices.
                  </p>
                </div>

                <span className="rounded-full bg-[#E5EBDD] px-3 py-2 text-xs font-semibold text-[#245B3F]">
                  {district || "Punjab markets"}
                </span>
              </div>
              <PriceOverview
                selectedCrop={selectedCrop}
                latestDate={latestDate}
                latestCropRecords={latestCropRecords}
                formatDate={formatDate}
                formatPrice={formatPrice}
              />
            </div>

            {/* Compare mandis */}
            <MandiComparison
            selectedCrop={selectedCrop}
            district={district}
            mandiComparisons={mandiComparisons}
            formatPrice={formatPrice}
            formatDate={formatDate}
          />

            {/* Price trend */}
            <PriceTrendChart
            selectedCrop={selectedCrop}
            trendData={trendData}
            trendMax={trendMax}
            formatPrice={formatPrice}
            formatDate={formatDate}
          />

            {/* Market records */}
            <MarketRecords
            cropRecords={cropRecords}
            selectedCrop={selectedCrop}
            formatPrice={formatPrice}
          />

            <p className="text-xs leading-5 text-[#718071]">
              Source: Government of India Open Government Data platform.
              Prices reflect the returned records and their reported arrival
              dates. The latest available record may not be from today.
            </p>
          </>
        )}
      </section>
    </>
  );
}
