
"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Navbar from "../Components/Navbar";

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

function formatRupees(value) {
  if (
    value === null ||
    value === undefined ||
    value === "" ||
    !Number.isFinite(Number(value))
  ) {
    return "Unavailable";
  }

  return `₹${Math.round(Number(value)).toLocaleString("en-IN")}`;
}


function getDateValue(value) {
  if (!value) return 0;

  const text = String(value).trim();

  const dmyMatch = text.match(
    /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/
  );

  if (dmyMatch) {
    const [, day, month, year] = dmyMatch;

    const date = new Date(
      Number(year),
      Number(month) - 1,
      Number(day)
    );

    if (
      date.getFullYear() !== Number(year) ||
      date.getMonth() !== Number(month) - 1 ||
      date.getDate() !== Number(day)
    ) {
      return 0;
    }

    return date.getTime();
  }

  const timestamp = Date.parse(text);

  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function normalizeMarketKey(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

export default function SmartMandiFinderPage() {
  const [crop, setCrop] = useState("");
  const [district, setDistrict] = useState("Hoshiarpur");
  const [quantity, setQuantity] = useState("20");
  const [cultivationCost, setCultivationCost] = useState("25000");
  const [sellingExpenses, setSellingExpenses] = useState("1000");

  // Farmer location
  const [origin, setOrigin] = useState("");
  const [originCoordinates, setOriginCoordinates] = useState("");
  const [locationStatus, setLocationStatus] = useState("");

  // Vehicle and fuel details
  const [vehicle, setVehicle] = useState("tractor");
  const [mileage, setMileage] = useState("5");
  const [dieselPrice, setDieselPrice] = useState("90");

  // Mandi prices and routing information
  const [records, setRecords] = useState([]);
  const [routeDetails, setRouteDetails] = useState({});
  const [routeErrors, setRouteErrors] = useState({});
  const [transportCosts, setTransportCosts] = useState({});

  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");

  const inputClass =
    "mt-2 w-full rounded-xl border border-[#DCE3D6] bg-white px-4 py-3 text-[#203B2B] outline-none focus:border-[#56815D] focus:ring-2 focus:ring-[#56815D]/20";

  function updateTransportCost(marketName, value) {
    setTransportCosts((previous) => ({
      ...previous,
      [marketName]: value,
    }));
  }

  // Detect GPS and keep coordinates even if reverse geocoding fails.
  async function getCurrentLocation() {
    if (!navigator.geolocation) {
      setLocationStatus(
        "GPS is not supported. Enter your village manually."
      );
      return;
    }

    setLocationStatus("Detecting your location...");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const coordinates =
          `${position.coords.latitude}, ${position.coords.longitude}`;

        setOriginCoordinates(coordinates);

        try {
          setLocationStatus(
            "GPS detected. Finding your village or area..."
          );

          const response = await fetch("/api/mandi-routes", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              action: "reverseGeocode",
              origin: coordinates,
            }),
          });

          const data = await response.json();

          if (!response.ok || !data.success) {
            throw new Error(
              data.error || `Location API error: ${response.status}`
            );
          }

          const locationName =
            data.location?.locationName?.trim();

          if (locationName) {
            setOrigin(locationName);
            setLocationStatus(`Location detected: ${locationName}`);
          } else {
            setOrigin(coordinates);
            setLocationStatus(
              "GPS detected. Coordinates are saved for routing, but no area name was returned."
            );
          }
        } catch (error) {
          console.error("GPS reverse-geocoding error:", error);

          // Coordinates can still be used for route calculations.
          setOrigin(coordinates);
          setLocationStatus(
            `GPS detected, but the area name lookup failed: ${
              error.message || "Unknown error"
            }. Coordinates are saved.`
          );
        }
      },
      (error) => {
        console.error("Browser GPS error:", error);

        const messages = {
          1: "Location permission denied. Allow location access in your browser.",
          2: "Your location is unavailable. Check your device location settings.",
          3: "GPS request timed out. Try again.",
        };

        setLocationStatus(
          messages[error.code] ||
            "Unable to access GPS. Enter your village manually."
        );
      },
      {
        enableHighAccuracy: false,
        timeout: 20000,
        maximumAge: 60000,
      }
    );
  }

  async function handleSearch(event) {
    event.preventDefault();

    if (!crop.trim()) {
      setMessage("Please enter the name of your crop.");
      setStatus("error");
      return;
    }

    if (
      !Number.isFinite(Number(quantity)) ||
      Number(quantity) <= 0
    ) {
      setMessage("Enter a valid harvest quantity greater than zero.");
      setStatus("error");
      return;
    }

    if (
      !Number.isFinite(Number(cultivationCost)) ||
      !Number.isFinite(Number(sellingExpenses)) ||
      Number(cultivationCost) < 0 ||
      Number(sellingExpenses) < 0
    ) {
      setMessage("Enter valid, non-negative expense amounts.");
      setStatus("error");
      return;
    }

    if (
      !Number.isFinite(Number(mileage)) ||
      Number(mileage) <= 0 ||
      !Number.isFinite(Number(dieselPrice)) ||
      Number(dieselPrice) < 0
    ) {
      setMessage("Enter valid vehicle mileage and diesel price.");
      setStatus("error");
      return;
    }

    setStatus("loading");
    setMessage("");
    setRecords([]);
    setRouteDetails({});
    setRouteErrors({});
    setTransportCosts({});

    try {
      // Step 1: Fetch government mandi prices.
      const params = new URLSearchParams({
        crop: crop.trim(),
        district,
        limit: "50",
      });

      const response = await fetch(
        `/api/mandi-prices?${params.toString()}`
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error || "Unable to retrieve mandi prices."
        );
      }

      const validRecords = (data.records || []).filter((record) => {
        const price = Number(record.Modal_Price);

        return (
          record.Market &&
          Number.isFinite(price) &&
          price > 0
        );
      });

      // Keep the newest available record for each market.
      const marketMap = new Map();

      for (const record of validRecords) {
        const key = normalizeMarketKey(record.Market);
        const previous = marketMap.get(key);

        if (
          !previous ||
          getDateValue(record.Arrival_Date) >
            getDateValue(previous.Arrival_Date)
        ) {
          marketMap.set(key, record);
        }
      }

      const uniqueMarkets = Array.from(marketMap.values());

      setRecords(uniqueMarkets);

      if (uniqueMarkets.length === 0) {
        setStatus("empty");
        setMessage(
          "No matching market prices were found. Try another crop or district."
        );
        return;
      }

      // Step 2: Request routes when a starting location is available.
      let routesForSearch = {};
      let errorsForSearch = {};
      let routeLookupFailed = false;
      let routeServiceMessage = "";

      if (origin.trim() || originCoordinates) {
        try {
          const routeResponse = await fetch("/api/mandi-routes", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              origin: originCoordinates || origin.trim(),
              district,
              markets: uniqueMarkets.map(
                (record) => record.Market
              ),
            }),
          });

          const routeData = await routeResponse.json();

          if (!routeResponse.ok || !routeData.success) {
            routeLookupFailed = true;
            routeServiceMessage =
              routeData.error ||
              `Route service returned HTTP ${routeResponse.status}.`;
          } else {
            // Normalize keys to avoid mismatches caused by case
            // or extra spaces in mandi names.
            for (const [marketName, route] of Object.entries(
              routeData.routes || {}
            )) {
              routesForSearch[normalizeMarketKey(marketName)] = route;
            }

            for (const [marketName, errorText] of Object.entries(
              routeData.routeErrors || {}
            )) {
              errorsForSearch[normalizeMarketKey(marketName)] =
                errorText;
            }

            routeServiceMessage = routeData.message || "";
          }
        } catch (error) {
          routeLookupFailed = true;
          routeServiceMessage =
            error.message || "Unable to contact the route service.";
          console.error("Mandi route request failed:", error);
        }
      }

      setRouteDetails(routesForSearch);
      setRouteErrors(errorsForSearch);
      setStatus("success");

      const routeCount = Object.keys(routesForSearch).length;

      if (!origin.trim() && !originCoordinates) {
        setMessage(
          "Mandi prices loaded. Enter your starting location to calculate road distances and fuel costs. You can also enter a transport cost manually."
        );
      } else if (routeCount === 0 || routeLookupFailed) {
        setMessage(
          `Mandi prices loaded, but no usable road routes were found. ${
            routeServiceMessage
              ? `${routeServiceMessage} `
              : ""
          }Enter a transport cost manually for each mandi to calculate estimated profit.`
        );
      } else {
        setMessage(
          `Mandi prices loaded. Road routes found for ${routeCount} of ${uniqueMarkets.length} mandis. ${
            uniqueMarkets.length > routeCount
              ? "For mandis without routes, enter a transport cost manually."
              : ""
          }`
        );
      }
    } catch (error) {
      console.error("Smart Mandi Finder search error:", error);
      setStatus("error");
      setMessage(
        error.message || "Something went wrong. Please try again."
      );
    }
  }

  // Calculate the revenue, transport cost and profit for each mandi.
  const results = useMemo(() => {
    const qty = Number(quantity);
    const cultivation = Number(cultivationCost);
    const selling = Number(sellingExpenses);
    const fuelPrice = Number(dieselPrice);
    const kmPerLitre = Number(mileage);

    return records
      .map((record) => {
        const price = Number(record.Modal_Price);
        const key = normalizeMarketKey(record.Market);
        const route = routeDetails[key];

        const hasRoute = Boolean(
          route &&
            Number.isFinite(Number(route.distanceKm)) &&
            Number(route.distanceKm) > 0
        );

        const distanceKm = hasRoute
          ? Number(route.distanceKm)
          : null;

        const roundTripKm = hasRoute
          ? Number.isFinite(Number(route.roundTripKm)) &&
            Number(route.roundTripKm) > 0
            ? Number(route.roundTripKm)
            : distanceKm * 2
          : null;

        const automaticFuelCost =
          hasRoute &&
          roundTripKm !== null &&
          kmPerLitre > 0 &&
          Number.isFinite(fuelPrice) &&
          fuelPrice >= 0
            ? (roundTripKm / kmPerLitre) * fuelPrice
            : null;

        const manualValue = transportCosts[record.Market];
        const manualNumber = Number(manualValue);

        const hasManualOverride =
          manualValue !== undefined &&
          String(manualValue).trim() !== "" &&
          Number.isFinite(manualNumber) &&
          manualNumber >= 0;

        const transport = hasManualOverride
          ? manualNumber
          : automaticFuelCost;

        const grossRevenue = qty * price;

        // Do not treat missing transport cost as zero.
        const hasUsableTransport =
          transport !== null &&
          Number.isFinite(transport) &&
          transport >= 0;

        const profit = hasUsableTransport
          ? grossRevenue - cultivation - transport - selling
          : null;

        return {
          ...record,
          price,
          transport,
          automaticFuelCost,
          roundTripKm,
          distanceKm,
          durationMinutes: hasRoute
            ? Number(route.durationMinutes ?? 0)
            : null,
          grossRevenue,
          profit,
          hasRoute,
          hasManualOverride,
          routeError: routeErrors[key] || "",
        };
      })
      .sort((a, b) => {
        if (a.profit === null && b.profit === null) {
          return 0;
        }

        if (a.profit === null) return 1;
        if (b.profit === null) return -1;

        return b.profit - a.profit;
      });
  }, [
    records,
    quantity,
    cultivationCost,
    sellingExpenses,
    transportCosts,
    routeDetails,
    routeErrors,
    mileage,
    dieselPrice,
  ]);

  const topTwo = results.slice(0, 2);

  return (
    <main className="min-h-screen bg-[#F5F1E6] text-[#203B2B]">
    <header className="border-b border-[#DCE4D6]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
          <Link
            href="/"
            className="flex items-center gap-2"
            aria-label="Krishi Saathi home"
          >
            <span className="text-3xl" aria-hidden="true">
              🌾
            </span>
            <span className="text-xl font-bold tracking-tight">
              Krishi Saathi
            </span>
          </Link>

          <Link
            href="/"
            className="rounded-full px-4 py-2 text-sm font-medium transition-colors hover:bg-[#E5EBDD]"
          >
            ← Home
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-10 lg:px-12 lg:py-14">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#56815D]">
          Your crops. Your market. Your choice.
        </p>

        <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
          Smart Mandi Finder
        </h1>

        <p className="mt-4 max-w-3xl leading-7 text-[#607064]">
          Compare government-reported crop prices and estimate
          your returns after cultivation, transport and selling
          expenses. Choose a mandi based on estimated profit,
          not just its price.
        </p>

        <form
          onSubmit={handleSearch}
          className="mt-8 rounded-3xl border border-[#DCE3D6] bg-white p-6 shadow-sm sm:p-8"
        >
          <h2 className="text-2xl font-semibold">
            Tell us about your harvest
          </h2>

          <p className="mt-2 text-sm leading-6 text-[#607064]">
            Enter your crop, location, vehicle and expenses to
            compare mandis.
          </p>

          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <label className="text-sm font-medium">
              Crop name
              <input
                className={inputClass}
                value={crop}
                onChange={(event) => setCrop(event.target.value)}
                placeholder="e.g. Potato, Wheat"
                required
              />
            </label>

            <label className="text-sm font-medium">
              District
              <select
                className={inputClass}
                value={district}
                onChange={(event) => setDistrict(event.target.value)}
                required
              >
                {districts.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm font-medium">
              Quantity to sell (quintals)
              <input
                className={inputClass}
                type="number"
                min="0.01"
                step="any"
                value={quantity}
                onChange={(event) => setQuantity(event.target.value)}
                required
              />
            </label>

            <label className="text-sm font-medium">
              Total cultivation cost (₹)
              <input
                className={inputClass}
                type="number"
                min="0"
                step="1"
                value={cultivationCost}
                onChange={(event) =>
                  setCultivationCost(event.target.value)
                }
                required
              />
              <span className="mt-1 block text-xs font-normal text-[#718074]">
                Seeds, labour, fertilizer and other farm costs.
              </span>
            </label>

            <label className="text-sm font-medium">
              Other selling expenses (₹)
              <input
                className={inputClass}
                type="number"
                min="0"
                step="1"
                value={sellingExpenses}
                onChange={(event) =>
                  setSellingExpenses(event.target.value)
                }
                required
              />
              <span className="mt-1 block text-xs font-normal text-[#718074]">
                Loading, unloading or market fees.
              </span>
            </label>

            <label className="text-sm font-medium">
              Starting location
              <input
                className={inputClass}
                value={origin}
                onChange={(event) => {
                  setOrigin(event.target.value);
                  setOriginCoordinates("");
                  setLocationStatus("");
                }}
                placeholder="Village, city or latitude, longitude"
              />

              <button
                type="button"
                onClick={getCurrentLocation}
                className="mt-2 rounded-lg bg-[#EAF0E5] px-4 py-2 text-sm font-semibold text-[#245B3F]"
              >
                Use my current location
              </button>

              {locationStatus && (
                <span className="mt-2 block text-xs">
                  {locationStatus}
                </span>
              )}
            </label>

            <label className="text-sm font-medium">
              Vehicle type
              <select
                className={inputClass}
                value={vehicle}
                onChange={(event) => {
                  const selected = event.target.value;
                  setVehicle(selected);

                  const defaults = {
                    tractor: "5",
                    pickup: "10",
                    truck: "4",
                  };

                  setMileage(defaults[selected]);
                }}
              >
                <option value="tractor">Tractor</option>
                <option value="pickup">Pickup / small vehicle</option>
                <option value="truck">Truck</option>
              </select>
            </label>

            <label className="text-sm font-medium">
              Vehicle mileage (km per litre)
              <input
                className={inputClass}
                type="number"
                min="0.1"
                step="any"
                value={mileage}
                onChange={(event) => setMileage(event.target.value)}
                required
              />
            </label>

            <label className="text-sm font-medium">
              Diesel price (₹ per litre)
              <input
                className={inputClass}
                type="number"
                min="0"
                step="any"
                value={dieselPrice}
                onChange={(event) =>
                  setDieselPrice(event.target.value)
                }
                required
              />
            </label>
          </div>

          <button
            type="submit"
            disabled={status === "loading"}
            className="mt-7 w-full rounded-xl bg-[#245B3F] px-6 py-4 font-semibold text-white transition hover:bg-[#19442D] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            {status === "loading"
              ? "Searching mandi prices..."
              : "Find and compare mandis →"}
          </button>
        </form>

        {message && (
          <div
            role="status"
            className={`mt-5 rounded-xl border p-4 text-sm leading-6 ${
              status === "error"
                ? "border-red-200 bg-red-50 text-red-800"
                : "border-[#DCE3D6] bg-white text-[#607064]"
            }`}
          >
            {message}
          </div>
        )}

        {status === "success" && (
          <section className="mt-10">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#56815D]">
              Market comparison
            </p>

            <h2 className="mt-2 text-3xl font-semibold">
              Estimated returns by mandi
            </h2>

            <p className="mt-3 leading-7 text-[#607064]">
              Mandis are ranked by estimated profit after transport
              costs. Road distances and travel times depend on the
              routing service.
            </p>

            <div className="mt-6 rounded-2xl border border-[#C8D6BF] bg-[#EAF0E5] p-5">
              <h3 className="font-semibold">
                How profit is calculated
              </h3>

              <p className="mt-2 text-sm leading-6 text-[#607064]">
                Profit = (quantity × modal price) − cultivation
                cost − transport cost − other selling expenses.
              </p>

              <p className="mt-2 text-sm leading-6 text-[#607064]">
                Round-trip fuel cost = (round-trip distance ÷
                vehicle mileage) × diesel price.
              </p>

              <p className="mt-2 text-xs leading-5 text-[#607064]">
                Fuel estimates exclude tolls, loading, vehicle hire
                and other costs unless you include them in a manual
                transport override. Mileage values are estimates
                and should be adjusted for your vehicle.
              </p>
            </div>

            {topTwo.length > 0 && (
              <div className="mt-6 grid gap-5 lg:grid-cols-2">
                {topTwo.map((market, index) => (
                  <article
                    key={market.Market}
                    className="rounded-3xl border border-[#C8D6BF] bg-white p-6 shadow-sm"
                  >
                    <p className="text-sm font-semibold uppercase tracking-wider text-[#56815D]">
                      {market.profit === null
                        ? "Route / cost needed"
                        : index === 0
                          ? "Highest estimated return"
                          : "Second option"}
                    </p>

                    <h3 className="mt-3 text-2xl font-semibold">
                      {market.Market}
                    </h3>

                    <p className="mt-2 text-sm text-[#607064]">
                      Reported arrival date:{" "}
                      {market.Arrival_Date || "Not provided"}
                    </p>

                    <div className="mt-5 rounded-2xl bg-[#F5F1E6] p-4">
                      <p className="text-sm text-[#607064]">
                        Estimated profit
                      </p>

                      <p
                        className={`mt-1 text-3xl font-bold ${
                          market.profit !== null &&
                          market.profit < 0
                            ? "text-red-700"
                            : "text-[#245B3F]"
                        }`}
                      >
                        {formatRupees(market.profit)}
                      </p>
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-[#607064]">
                          Modal price / quintal
                        </p>
                        <p className="mt-1 font-semibold">
                          {formatRupees(market.price)}
                        </p>
                      </div>

                      <div>
                        <p className="text-[#607064]">
                          Gross revenue
                        </p>
                        <p className="mt-1 font-semibold">
                          {formatRupees(market.grossRevenue)}
                        </p>
                      </div>

                      <div>
                        <p className="text-[#607064]">
                          One-way road distance
                        </p>
                        <p className="mt-1 font-semibold">
                          {market.hasRoute
                            ? `${market.distanceKm.toFixed(1)} km`
                            : "Not available"}
                        </p>
                      </div>

                      <div>
                        <p className="text-[#607064]">
                          Estimated one-way travel
                        </p>
                        <p className="mt-1 font-semibold">
                          {market.hasRoute
                            ? `${Math.round(market.durationMinutes)} min`
                            : "Not available"}
                        </p>
                      </div>

                      <div>
                        <p className="text-[#607064]">
                          Round-trip distance
                        </p>
                        <p className="mt-1 font-semibold">
                          {market.hasRoute
                            ? `${market.roundTripKm.toFixed(1)} km`
                            : "Not available"}
                        </p>
                      </div>

                      <div>
                        <p className="text-[#607064]">
                          Estimated fuel cost
                        </p>
                        <p className="mt-1 font-semibold">
                          {formatRupees(market.automaticFuelCost)}
                        </p>
                      </div>
                    </div>

                    {!market.hasRoute && market.routeError && (
                      <p className="mt-4 rounded-lg bg-amber-50 p-3 text-xs leading-5 text-amber-900">
                        Route information: {market.routeError}
                      </p>
                    )}

                    <label className="mt-5 block text-sm font-medium">
                      Transport cost override (₹)
                      <input
                        className={inputClass}
                        type="number"
                        min="0"
                        step="1"
                        value={transportCosts[market.Market] ?? ""}
                        placeholder={
                          market.hasRoute
                            ? `Default: ${formatRupees(
                                market.automaticFuelCost
                              )}`
                            : "Enter transport cost"
                        }
                        onChange={(event) =>
                          updateTransportCost(
                            market.Market,
                            event.target.value
                          )
                        }
                      />

                      <span className="mt-1 block text-xs font-normal text-[#718074]">
                        Leave blank to use estimated fuel cost when
                        a route is available. If no route is found,
                        enter your estimated transport cost to
                        calculate profit.
                      </span>
                    </label>

                    <div className="mt-5 space-y-3 border-t border-[#E0E6DA] pt-4 text-sm">
                      <div className="flex justify-between gap-3">
                        <span className="text-[#607064]">
                          Cultivation cost
                        </span>
                        <span>
                          {formatRupees(Number(cultivationCost))}
                        </span>
                      </div>

                      <div className="flex justify-between gap-3">
                        <span className="text-[#607064]">
                          Transport cost used
                        </span>
                        <span>{formatRupees(market.transport)}</span>
                      </div>

                      <div className="flex justify-between gap-3">
                        <span className="text-[#607064]">
                          Other selling expenses
                        </span>
                        <span>
                          {formatRupees(Number(sellingExpenses))}
                        </span>
                      </div>

                      <div className="flex justify-between gap-3 border-t border-[#E0E6DA] pt-3 font-semibold">
                        <span>Estimated profit</span>
                        <span
                          className={
                            market.profit !== null &&
                            market.profit < 0
                              ? "text-red-700"
                              : "text-[#245B3F]"
                          }
                        >
                          {formatRupees(market.profit)}
                        </span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}

            {results.length > 2 && (
              <div className="mt-8">
                <h3 className="text-xl font-semibold">
                  All other matching mandis
                </h3>

                <div className="mt-4 overflow-x-auto rounded-2xl border border-[#DCE3D6] bg-white">
                  <table className="w-full min-w-[850px] text-left text-sm">
                    <thead className="bg-[#EAF0E5]">
                      <tr>
                        <th className="p-4">Mandi</th>
                        <th className="p-4">Modal price / quintal</th>
                        <th className="p-4">Road distance</th>
                        <th className="p-4">Transport cost</th>
                        <th className="p-4">Estimated profit</th>
                        <th className="p-4">Arrival date</th>
                      </tr>
                    </thead>

                    <tbody>
                      {results.slice(2).map((market) => (
                        <tr
                          key={market.Market}
                          className="border-t border-[#E0E6DA]"
                        >
                          <td className="p-4 font-medium">
                            {market.Market}
                            {!market.hasRoute && market.routeError && (
                              <p className="mt-1 max-w-xs text-xs font-normal text-amber-800">
                                {market.routeError}
                              </p>
                            )}
                          </td>

                          <td className="p-4">
                            {formatRupees(market.price)}
                          </td>

                          <td className="p-4">
                            {market.hasRoute
                              ? `${market.distanceKm.toFixed(1)} km`
                              : "Not available"}
                          </td>

                          <td className="p-4">
                            <input
                              type="number"
                              min="0"
                              step="1"
                              value={transportCosts[market.Market] ?? ""}
                              placeholder={
                                market.hasRoute
                                  ? String(
                                      Math.round(
                                        market.automaticFuelCost
                                      )
                                    )
                                  : "Enter cost"
                              }
                              aria-label={`Transport cost for ${market.Market}`}
                              onChange={(event) =>
                                updateTransportCost(
                                  market.Market,
                                  event.target.value
                                )
                              }
                              className="w-28 rounded-lg border border-[#DCE3D6] bg-white px-3 py-2"
                            />
                          </td>

                          <td
                            className={`p-4 font-semibold ${
                              market.profit !== null &&
                              market.profit < 0
                                ? "text-red-700"
                                : "text-[#245B3F]"
                            }`}
                          >
                            {formatRupees(market.profit)}
                          </td>

                          <td className="p-4">
                            {market.Arrival_Date || "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <p className="mt-6 text-xs leading-5 text-[#718074]">
              Source: data.gov.in through your existing API.
              Government prices may be delayed and may vary by crop
              variety and quality. Route data depends on location
              matching and the routing service. Estimated profits
              are not guaranteed sale returns.
            </p>
          </section>
        )}

        {status === "empty" && (
          <div className="mt-5 rounded-xl border border-[#DCE3D6] bg-white p-4 text-sm text-[#607064]">
            Try another crop or district. The API may not have
            matching market records for your search.
          </div>
        )}
      </div>
    </main>
  );
}
