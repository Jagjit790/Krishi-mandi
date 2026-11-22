"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "../context/AuthContext";
import Navbar from "../Components/Navbar";
import Reveal from "../Components/Reveal";

const punjabDistricts = [
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

const sampleSuggestions = [
  { crop: "Wheat", district: "Ludhiana" },
  { crop: "Potato", district: "Jalandhar" },
  { crop: "Onion", district: "Amritsar" },
  { crop: "Tomato", district: "Patiala" },
  { crop: "Paddy(Dhan)", district: "Bathinda" },
  { crop: "Cotton", district: "Fazilka" },
];

function getCropEmoji(name) {
  if (!name) return "🌱";
  const lower = name.toLowerCase();
  if (lower.includes("wheat") || lower.includes("gehun")) return "🌾";
  if (lower.includes("rice") || lower.includes("paddy") || lower.includes("dhan")) return "🌾";
  if (lower.includes("potato") || lower.includes("aloo")) return "🥔";
  if (lower.includes("onion") || lower.includes("pyaz")) return "🧅";
  if (lower.includes("tomato") || lower.includes("tamatar")) return "🍅";
  if (lower.includes("cotton") || lower.includes("kapas")) return "☁️";
  if (lower.includes("maize") || lower.includes("makka")) return "🌽";
  if (lower.includes("mustard") || lower.includes("sarson")) return "🌼";
  if (lower.includes("apple") || lower.includes("seb")) return "🍎";
  if (lower.includes("sugarcane") || lower.includes("ganna")) return "🎋";
  return "🌱";
}

function formatPrice(val) {
  if (val === null || val === undefined || val === "" || isNaN(Number(val))) {
    return "—";
  }
  return `₹${Number(val).toLocaleString("en-IN")}`;
}

export default function YourCropsPage() {
  const { user } = useAuth();
  const [crops, setCrops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [refreshingId, setRefreshingId] = useState(null);

  // Quick search form
  const [newCrop, setNewCrop] = useState("");
  const [newDistrict, setNewDistrict] = useState(user?.district || "Ludhiana");
  const [addingCrop, setAddingCrop] = useState(false);
  const [actionMessage, setActionMessage] = useState("");

  const refreshCropsList = async () => {
    try {
      const url = user?.krishiId
        ? `/api/crops/searched?krishiId=${encodeURIComponent(user.krishiId)}`
        : `/api/crops/searched`;

      const res = await fetch(url);
      const data = await res.json();
      if (data.success && Array.isArray(data.crops)) {
        setCrops(data.crops);
      }
    } catch (err) {
      console.error("Failed to load your crops:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    const fetchCrops = async () => {
      try {
        const url = user?.krishiId
          ? `/api/crops/searched?krishiId=${encodeURIComponent(user.krishiId)}`
          : `/api/crops/searched`;

        const res = await fetch(url);
        const data = await res.json();
        if (!ignore && data.success && Array.isArray(data.crops)) {
          setCrops(data.crops);
        }
      } catch (err) {
        console.error("Failed to load your crops:", err);
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    queueMicrotask(() => {
      fetchCrops();
    });

    return () => {
      ignore = true;
    };
  }, [user]);

  // Refresh live government price for a specific crop
  const handleRefreshLivePrice = async (item) => {
    setRefreshingId(item._id);
    setActionMessage("");
    try {
      const res = await fetch(
        `/api/mandi-prices?crop=${encodeURIComponent(item.crop)}&district=${encodeURIComponent(item.district)}`
      );
      const data = await res.json();

      if (data.success && Array.isArray(data.records) && data.records.length > 0) {
        // Save fresh records to database
        await fetch("/api/crops/save-search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            crop: item.crop,
            district: item.district,
            krishiId: user?.krishiId || item.krishiId || null,
            farmerName: user?.name || item.farmerName || null,
            records: data.records,
          }),
        });

        setActionMessage(`Updated live government prices for ${item.crop} (${item.district})!`);
        await refreshCropsList();
      } else {
        setActionMessage(`No fresh records returned for ${item.crop} in ${item.district}.`);
      }
    } catch (err) {
      setActionMessage(`Could not refresh price: ${err.message}`);
    } finally {
      setRefreshingId(null);
      setTimeout(() => setActionMessage(""), 4000);
    }
  };

  // Add and search new crop
  const handleAddAndSearch = async (e) => {
    if (e) e.preventDefault();
    if (!newCrop.trim() || !newDistrict.trim()) return;

    setAddingCrop(true);
    setActionMessage("");

    try {
      const res = await fetch(
        `/api/mandi-prices?crop=${encodeURIComponent(newCrop.trim())}&district=${encodeURIComponent(newDistrict.trim())}`
      );
      const data = await res.json();

      const records = data.success && Array.isArray(data.records) ? data.records : [];

      // Save to database
      await fetch("/api/crops/save-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          crop: newCrop.trim(),
          district: newDistrict.trim(),
          krishiId: user?.krishiId || null,
          farmerName: user?.name || null,
          records,
        }),
      });

      setNewCrop("");
      setActionMessage(`Added ${newCrop.trim()} (${newDistrict.trim()}) to Your Crops!`);
      await refreshCropsList();
    } catch (err) {
      setActionMessage(`Error saving crop: ${err.message}`);
    } finally {
      setAddingCrop(false);
      setTimeout(() => setActionMessage(""), 4000);
    }
  };

  // Delete crop
  const handleDeleteCrop = async (id, cropName) => {
    if (!confirm(`Remove ${cropName} from Your Crops?`)) return;

    try {
      const res = await fetch(`/api/crops/searched?id=${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setCrops((prev) => prev.filter((c) => c._id !== id));
        setActionMessage(`Removed ${cropName} from Your Crops.`);
        setTimeout(() => setActionMessage(""), 3000);
      }
    } catch (err) {
      console.error("Failed to delete crop:", err);
    }
  };

  const filteredCrops = crops.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.crop?.toLowerCase().includes(q) ||
      item.district?.toLowerCase().includes(q) ||
      item.market?.toLowerCase().includes(q)
    );
  });

  return (
    <main className="min-h-screen bg-[#F5F1E6] text-[#203B2B] flex flex-col">
      <Navbar />

      <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-12 flex-1">
        {/* Page Header */}
        <Reveal y={15}>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-[#DCE4D6]">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#C8D6BF] bg-white/70 px-3.5 py-1 text-xs font-semibold text-[#56815D]">
                <span className="h-2 w-2 rounded-full bg-[#245B3F]" />
                Saved Searches & Live Govt Data
              </div>
              <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl text-[#203B2B] flex items-center gap-3">
                <span>Your Crops</span>
                <span className="text-2xl sm:text-3xl">🌾</span>
              </h1>
              <p className="mt-2 text-sm text-[#607064] max-w-2xl">
                Every crop you search is automatically stored in the database. Track real-time prices, mandi arrival dates, and market comparisons reported by the government API.
              </p>
            </div>

            {user && (
              <div className="rounded-2xl border border-[#C8D6BF] bg-[#F5F9F2] px-4 py-2.5 text-xs text-[#203B2B] self-start md:self-auto">
                <span className="text-[#607064]">Farmer:</span>{" "}
                <strong className="text-[#203B2B]">{user.name}</strong>{" "}
                <span className="rounded bg-[#E8F0E4] px-1.5 py-0.5 font-mono text-[11px] font-bold text-[#245B3F]">
                  {user.krishiId}
                </span>
              </div>
            )}
          </div>
        </Reveal>

        {/* Action feedback banner */}
        {actionMessage && (
          <div className="mt-4 rounded-xl border border-[#A9C5A0] bg-[#EAF2E6] px-4 py-3 text-sm font-medium text-[#203B2B] animate-in fade-in">
            {actionMessage}
          </div>
        )}

        {/* Quick Add / Search Card */}
        <Reveal y={20} delay={0.05}>
          <div className="mt-8 rounded-3xl border border-[#DCE4D6] bg-white p-5 sm:p-6 shadow-sm">
            <h2 className="text-base font-bold text-[#203B2B] flex items-center gap-2">
              <span>🔍</span> Search & Track a New Crop
            </h2>
            <p className="mt-1 text-xs text-[#607064]">
              Search any crop across Punjab mandis. It will be fetched from the government API and saved to Your Crops.
            </p>

            <form onSubmit={handleAddAndSearch} className="mt-4 grid gap-3 sm:grid-cols-12">
              <div className="sm:col-span-5">
                <input
                  type="text"
                  required
                  value={newCrop}
                  onChange={(e) => setNewCrop(e.target.value)}
                  placeholder="Enter crop name (e.g. Potato, Wheat, Onion)"
                  className="w-full min-h-12 rounded-xl border border-[#DCE4D6] bg-[#F9F8F2] px-4 text-sm text-[#203B2B] outline-none placeholder:text-[#89948A] focus:border-[#245B3F] focus:ring-2 focus:ring-[#A9C5A0]"
                />
              </div>

              <div className="sm:col-span-4">
                <select
                  value={newDistrict}
                  onChange={(e) => setNewDistrict(e.target.value)}
                  className="w-full min-h-12 rounded-xl border border-[#DCE4D6] bg-[#F9F8F2] px-4 text-sm text-[#203B2B] outline-none focus:border-[#245B3F] focus:ring-2 focus:ring-[#A9C5A0]"
                >
                  {punjabDistricts.map((d) => (
                    <option key={d} value={d}>
                      {d} District
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-3">
                <button
                  type="submit"
                  disabled={addingCrop}
                  className="w-full min-h-12 flex items-center justify-center gap-2 rounded-xl bg-[#245B3F] px-5 font-semibold text-white transition hover:bg-[#19442D] disabled:opacity-60 shadow-sm"
                >
                  {addingCrop ? (
                    "Fetching Govt API..."
                  ) : (
                    <>
                      <span>Track Crop</span>
                      <span>+</span>
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Quick Suggestions */}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-xs text-[#718074]">Popular Punjab crops:</span>
              {sampleSuggestions.map((s) => (
                <button
                  key={`${s.crop}-${s.district}`}
                  type="button"
                  onClick={() => {
                    setNewCrop(s.crop);
                    setNewDistrict(s.district);
                  }}
                  className="rounded-full border border-[#DCE4D6] bg-[#F5F1E6] px-2.5 py-1 text-xs text-[#203B2B] transition hover:bg-[#E8F0E4] hover:border-[#245B3F]"
                >
                  {getCropEmoji(s.crop)} {s.crop} ({s.district})
                </button>
              ))}
            </div>
          </div>
        </Reveal>

        {/* Search within Your Crops */}
        {crops.length > 0 && (
          <div className="mt-8 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-xl font-bold text-[#203B2B]">
              Your Tracked Crops ({filteredCrops.length})
            </h2>

            <div className="relative max-w-xs w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter your saved crops..."
                className="w-full rounded-xl border border-[#DCE4D6] bg-white px-4 py-2 text-xs text-[#203B2B] outline-none placeholder:text-[#89948A] focus:border-[#245B3F]"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-2.5 text-xs text-[#89948A] hover:text-[#203B2B]"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        )}

        {/* Crops List or Empty State */}
        <div className="mt-6">
          {loading ? (
            <div className="rounded-3xl border border-[#DCE4D6] bg-white p-12 text-center shadow-sm">
              <div className="inline-block animate-spin text-3xl">🌾</div>
              <p className="mt-3 text-sm font-semibold text-[#607064]">
                Loading your tracked crops from database...
              </p>
            </div>
          ) : crops.length === 0 ? (
            /* Empty State */
            <div className="rounded-3xl border border-[#DCE4D6] bg-white p-10 sm:p-14 text-center shadow-sm max-w-2xl mx-auto">
              <span className="flex h-16 w-16 mx-auto items-center justify-center rounded-2xl bg-[#E3EBDD] text-3xl text-[#245B3F]">
                🌱
              </span>
              <h3 className="mt-4 text-2xl font-bold text-[#203B2B]">
                No Crops Tracked Yet
              </h3>
              <p className="mt-2 text-sm text-[#607064] max-w-md mx-auto">
                Whenever you search for a crop on the platform, it is automatically stored in your database and displayed here with live government market prices.
              </p>

              <div className="mt-6 flex flex-wrap gap-2 justify-center">
                {sampleSuggestions.map((s) => (
                  <button
                    key={s.crop}
                    type="button"
                    onClick={() => {
                      setNewCrop(s.crop);
                      setNewDistrict(s.district);
                      handleAddAndSearch();
                    }}
                    className="inline-flex items-center gap-1.5 rounded-full border border-[#C8D6BF] bg-[#F9F8F2] px-4 py-2 text-xs font-semibold text-[#245B3F] shadow-sm transition hover:bg-[#E8F0E4]"
                  >
                    <span>{getCropEmoji(s.crop)}</span>
                    <span>Track {s.crop} ({s.district})</span>
                  </button>
                ))}
              </div>

              <div className="mt-8 border-t border-[#E0E6DA] pt-6">
                <Link
                  href="/mandi-prices"
                  className="rounded-full bg-[#245B3F] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#19442D] shadow-sm"
                >
                  Search Mandi Prices ↗
                </Link>
              </div>
            </div>
          ) : filteredCrops.length === 0 ? (
            <div className="rounded-2xl border border-[#DCE4D6] bg-white p-8 text-center text-sm text-[#607064]">
              No saved crops match &ldquo;{searchQuery}&rdquo;.
            </div>
          ) : (
            /* Crop Cards Grid */
            <div className="grid gap-6 md:grid-cols-2">
              {filteredCrops.map((item) => {
                const isExpanded = expandedId === item._id;
                const isRefreshing = refreshingId === item._id;
                const emoji = getCropEmoji(item.crop);

                return (
                  <div
                    key={item._id}
                    className="rounded-3xl border border-[#DCE4D6] bg-white p-6 shadow-sm transition hover:shadow-md flex flex-col justify-between"
                  >
                    <div>
                      {/* Top Bar: Icon, Name, District, Menu */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E3EBDD] text-2xl shadow-inner">
                            {emoji}
                          </span>
                          <div>
                            <h3 className="text-xl font-bold text-[#203B2B] capitalize">
                              {item.crop}
                            </h3>
                            <p className="text-xs text-[#607064] flex items-center gap-1 mt-0.5">
                              <span>📍</span>
                              <span className="font-medium text-[#203B2B]">{item.district} District</span>
                              <span>•</span>
                              <span>{item.market || "Mandi"}</span>
                            </p>
                          </div>
                        </div>

                        {/* Delete Button */}
                        <button
                          type="button"
                          onClick={() => handleDeleteCrop(item._id, item.crop)}
                          className="rounded-lg p-1.5 text-xs text-[#89948A] hover:bg-red-50 hover:text-red-600 transition"
                          title="Remove from Your Crops"
                        >
                          🗑️
                        </button>
                      </div>

                      {/* Government Data Stats Banner */}
                      <div className="mt-5 rounded-2xl border border-[#DCE4D6] bg-[#F9F8F2] p-4">
                        <div className="flex items-center justify-between border-b border-[#E0E6DA] pb-2.5">
                          <span className="text-xs font-semibold text-[#557A4D] flex items-center gap-1">
                            <span>🏛️</span> Govt API Reported Data
                          </span>
                          <span className="text-[11px] font-mono text-[#718074]">
                            {item.arrivalDate ? `Arrival: ${item.arrivalDate}` : "Latest reported"}
                          </span>
                        </div>

                        <div className="mt-3 grid grid-cols-2 gap-3">
                          <div>
                            <p className="text-[11px] uppercase tracking-wider text-[#718074]">
                              Modal Price
                            </p>
                            <p className="text-2xl font-extrabold text-[#245B3F]">
                              {formatPrice(item.modalPrice)}
                              <span className="text-xs font-normal text-[#607064]"> / Quintal</span>
                            </p>
                          </div>

                          <div>
                            <p className="text-[11px] uppercase tracking-wider text-[#718074]">
                              Price Range
                            </p>
                            <p className="text-sm font-bold text-[#203B2B] mt-1">
                              {formatPrice(item.minPrice)} – {formatPrice(item.maxPrice)}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Expandable Breakdown of Mandis in District */}
                      {Array.isArray(item.rawRecords) && item.rawRecords.length > 0 && (
                        <div className="mt-4">
                          <button
                            type="button"
                            onClick={() => setExpandedId(isExpanded ? null : item._id)}
                            className="text-xs font-semibold text-[#245B3F] hover:underline flex items-center gap-1"
                          >
                            <span>{isExpanded ? "▲ Hide" : "▼ Show"} Markets in {item.district} ({item.rawRecords.length})</span>
                          </button>

                          {isExpanded && (
                            <div className="mt-2.5 space-y-2 rounded-xl border border-[#E0E6DA] bg-[#F5F9F2] p-3 text-xs max-h-48 overflow-y-auto">
                              {item.rawRecords.map((rec, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-center justify-between border-b border-white/60 pb-1.5 last:border-b-0 last:pb-0"
                                >
                                  <div>
                                    <span className="font-semibold text-[#203B2B]">{rec.Market || "Mandi"}</span>
                                    {rec.Variety && (
                                      <span className="text-[#718074] ml-1">({rec.Variety})</span>
                                    )}
                                  </div>
                                  <div className="text-right">
                                    <span className="font-mono font-bold text-[#245B3F]">
                                      {formatPrice(rec.Modal_Price)}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Bottom Actions */}
                    <div className="mt-6 pt-4 border-t border-[#E0E6DA] flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => handleRefreshLivePrice(item)}
                        disabled={isRefreshing}
                        className="flex items-center gap-1.5 text-xs font-semibold text-[#56815D] hover:text-[#245B3F] disabled:opacity-60"
                      >
                        <span className={isRefreshing ? "animate-spin" : ""}>🔄</span>
                        <span>{isRefreshing ? "Updating..." : "Refresh Govt Data"}</span>
                      </button>

                      <Link
                        href={`/mandi-prices?crop=${encodeURIComponent(item.crop)}&district=${encodeURIComponent(item.district)}`}
                        className="rounded-xl bg-[#245B3F] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#19442D] shadow-sm flex items-center gap-1"
                      >
                        <span>Analyze Mandi</span>
                        <span>↗</span>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
