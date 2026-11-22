"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
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

const indianStates = [
  "Punjab",
  "Haryana",
  "Himachal Pradesh",
  "Rajasthan",
  "Uttar Pradesh",
  "Madhya Pradesh",
  "Gujarat",
  "Maharashtra",
  "Bihar",
  "West Bengal",
  "Other",
];

export default function SignupPage() {
  const router = useRouter();
  const { login } = useAuth();

  // Form State: Name, State, District, PIN code, Village, Block (Krishi ID is generated afterwards)
  const [formData, setFormData] = useState({
    name: "",
    state: "Punjab",
    district: "Ludhiana",
    pincode: "",
    village: "",
    block: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [generatedFarmer, setGeneratedFarmer] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCopyKrishiId = () => {
    if (generatedFarmer?.krishiId) {
      navigator.clipboard.writeText(generatedFarmer.krishiId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validate fields
    if (
      !formData.name.trim() ||
      !formData.state.trim() ||
      !formData.district.trim() ||
      !formData.pincode.trim() ||
      !formData.village.trim() ||
      !formData.block.trim()
    ) {
      setError("Please fill out all required fields.");
      return;
    }

    if (!/^[1-9][0-9]{5}$/.test(formData.pincode.trim())) {
      setError("Please enter a valid 6-digit Indian PIN code (e.g. 141001).");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to create farmer account.");
      }

      // Store generated farmer record
      setGeneratedFarmer(data.farmer);

      // Alert the generated Krishi ID to the user as requested
      setTimeout(() => {
        alert(
          `🌾 Registration Successful!\n\nNamaste ${data.farmer.name}!\nYour Krishi ID has been generated:\n\n👉  ${data.farmer.krishiId}  👈\n\nPlease save this Krishi ID. You will use it to log in with your dummy OTP.`
        );
      }, 100);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleProceedToLogin = () => {
    if (generatedFarmer?.krishiId) {
      router.push(`/login?krishiId=${encodeURIComponent(generatedFarmer.krishiId)}`);
    } else {
      router.push("/login");
    }
  };

  const handleDirectDashboard = () => {
    if (generatedFarmer) {
      login(generatedFarmer);
      router.push("/profile");
    }
  };

  return (
    <main className="min-h-screen bg-[#F5F1E6] text-[#203B2B] flex flex-col">
      {/* Header */}
      <header className="border-b border-[#DCE4D6]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-12">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#245B3F] text-xl text-white shadow-sm">
              🌾
            </span>
            <span className="text-xl font-bold tracking-tight">
              Krishi Saathi
            </span>
          </Link>

          <Link
            href="/"
            className="rounded-full px-4 py-2 text-sm font-medium transition hover:bg-[#E5EBDD]"
          >
            ← Back to Home
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <section className="flex-1 flex items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="w-full max-w-2xl">
          <Reveal y={25}>
            <div className="rounded-3xl border border-[#DCE4D6] bg-white p-7 shadow-xl sm:p-10">
              
              {/* SUCCESS VIEW: Generated Krishi ID Display */}
              {generatedFarmer ? (
                <div className="text-center py-2 animate-in fade-in zoom-in-95 duration-300">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#E3EBDD] text-3xl text-[#245B3F] shadow-inner">
                    ✨
                  </div>

                  <p className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-[#56815D]">
                    Registration Complete
                  </p>

                  <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl text-[#203B2B]">
                    Krishi ID Generated Successfully!
                  </h1>

                  <p className="mt-2 text-sm text-[#607064] max-w-md mx-auto">
                    Namaste <strong className="text-[#203B2B]">{generatedFarmer.name}</strong>, your farmer profile has been registered in the database.
                  </p>

                  {/* Highlighted Krishi ID Box */}
                  <div className="my-6 rounded-2xl border-2 border-[#A9C5A0] bg-[#F5F9F2] p-5 text-center shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-wider text-[#56815D]">
                      Your Official Krishi ID
                    </p>
                    <div className="mt-2 flex items-center justify-center gap-3">
                      <span className="font-mono text-3xl font-extrabold tracking-wider text-[#245B3F]">
                        {generatedFarmer.krishiId}
                      </span>
                      <button
                        type="button"
                        onClick={handleCopyKrishiId}
                        className="rounded-xl border border-[#C8D6BF] bg-white px-3 py-1.5 text-xs font-semibold text-[#245B3F] shadow-sm transition hover:bg-[#E3EBDD]"
                        title="Copy to clipboard"
                      >
                        {copied ? "✓ Copied!" : "📋 Copy ID"}
                      </button>
                    </div>
                    <p className="mt-2 text-xs text-[#607064]">
                      Keep this ID safe. You will use this Krishi ID to log in with an OTP.
                    </p>
                  </div>

                  {/* Summary of Farmer Details */}
                  <div className="rounded-2xl border border-[#E0E6DA] bg-[#F9F8F2] p-4 text-left text-xs text-[#607064] space-y-1.5">
                    <p><span className="font-semibold text-[#203B2B]">Farmer Name:</span> {generatedFarmer.name}</p>
                    <p><span className="font-semibold text-[#203B2B]">State:</span> {generatedFarmer.state}</p>
                    <p><span className="font-semibold text-[#203B2B]">District:</span> {generatedFarmer.district}</p>
                    <p><span className="font-semibold text-[#203B2B]">Block / Tehsil:</span> {generatedFarmer.block}</p>
                    <p><span className="font-semibold text-[#203B2B]">Village:</span> {generatedFarmer.village}</p>
                    <p><span className="font-semibold text-[#203B2B]">PIN Code:</span> {generatedFarmer.pincode}</p>
                  </div>

                  {/* Actions */}
                  <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                    <button
                      type="button"
                      onClick={handleProceedToLogin}
                      className="flex-1 flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#245B3F] px-6 py-3 font-semibold text-white transition hover:bg-[#19442D] shadow-sm"
                    >
                      <span>Proceed to Login with OTP</span>
                      <span>→</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleDirectDashboard}
                      className="flex-1 flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[#C8D6BF] bg-white px-6 py-3 font-semibold text-[#203B2B] transition hover:bg-[#F5F1E6]"
                    >
                      <span>Go to Dashboard</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* SIGNUP FORM VIEW */
                <>
                  <div className="text-center">
                    <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#E3EBDD] text-2xl text-[#245B3F]">
                      👨‍🌾
                    </span>
                    <p className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-[#56815D]">
                      Farmer Registration
                    </p>
                    <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
                      Create Farmer Profile
                    </h1>
                    <p className="mt-2 text-sm text-[#607064]">
                      Enter your agricultural details below. Your unique Krishi ID will be automatically generated upon submission.
                    </p>
                  </div>

                  {/* Error Notification */}
                  {error && (
                    <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                      <p className="font-semibold">⚠️ Could not register</p>
                      <p className="mt-1">{error}</p>
                    </div>
                  )}

                  {/* Sign Up Form */}
                  <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                    {/* Name */}
                    <div>
                      <label
                        htmlFor="name"
                        className="block text-sm font-semibold text-[#203B2B]"
                      >
                        Farmer&apos;s Full Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="name"
                        name="name"
                        type="text"
                        required
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="e.g. Gurpreet Singh"
                        className="mt-1.5 w-full min-h-12 rounded-xl border border-[#DCE4D6] bg-[#F9F8F2] px-4 text-base text-[#203B2B] outline-none placeholder:text-[#89948A] focus:border-[#245B3F] focus:ring-2 focus:ring-[#A9C5A0]"
                      />
                    </div>

                    {/* State & District Grid */}
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label
                          htmlFor="state"
                          className="block text-sm font-semibold text-[#203B2B]"
                        >
                          State <span className="text-red-500">*</span>
                        </label>
                        <select
                          id="state"
                          name="state"
                          required
                          value={formData.state}
                          onChange={handleChange}
                          className="mt-1.5 w-full min-h-12 rounded-xl border border-[#DCE4D6] bg-[#F9F8F2] px-4 text-sm text-[#203B2B] outline-none focus:border-[#245B3F] focus:ring-2 focus:ring-[#A9C5A0]"
                        >
                          {indianStates.map((st) => (
                            <option key={st} value={st}>
                              {st}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label
                          htmlFor="district"
                          className="block text-sm font-semibold text-[#203B2B]"
                        >
                          District <span className="text-red-500">*</span>
                        </label>
                        {formData.state === "Punjab" ? (
                          <select
                            id="district"
                            name="district"
                            required
                            value={formData.district}
                            onChange={handleChange}
                            className="mt-1.5 w-full min-h-12 rounded-xl border border-[#DCE4D6] bg-[#F9F8F2] px-4 text-sm text-[#203B2B] outline-none focus:border-[#245B3F] focus:ring-2 focus:ring-[#A9C5A0]"
                          >
                            {punjabDistricts.map((dist) => (
                              <option key={dist} value={dist}>
                                {dist}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            id="district"
                            name="district"
                            type="text"
                            required
                            value={formData.district}
                            onChange={handleChange}
                            placeholder="Enter district name"
                            className="mt-1.5 w-full min-h-12 rounded-xl border border-[#DCE4D6] bg-[#F9F8F2] px-4 text-sm text-[#203B2B] outline-none focus:border-[#245B3F] focus:ring-2 focus:ring-[#A9C5A0]"
                          />
                        )}
                      </div>
                    </div>

                    {/* Block & Village Grid */}
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label
                          htmlFor="block"
                          className="block text-sm font-semibold text-[#203B2B]"
                        >
                          Block / Tehsil <span className="text-red-500">*</span>
                        </label>
                        <input
                          id="block"
                          name="block"
                          type="text"
                          required
                          value={formData.block}
                          onChange={handleChange}
                          placeholder="e.g. Ludhiana-1 / Jagraon"
                          className="mt-1.5 w-full min-h-12 rounded-xl border border-[#DCE4D6] bg-[#F9F8F2] px-4 text-sm text-[#203B2B] outline-none placeholder:text-[#89948A] focus:border-[#245B3F] focus:ring-2 focus:ring-[#A9C5A0]"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="village"
                          className="block text-sm font-semibold text-[#203B2B]"
                        >
                          Village Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          id="village"
                          name="village"
                          type="text"
                          required
                          value={formData.village}
                          onChange={handleChange}
                          placeholder="e.g. Baddowal"
                          className="mt-1.5 w-full min-h-12 rounded-xl border border-[#DCE4D6] bg-[#F9F8F2] px-4 text-sm text-[#203B2B] outline-none placeholder:text-[#89948A] focus:border-[#245B3F] focus:ring-2 focus:ring-[#A9C5A0]"
                        />
                      </div>
                    </div>

                    {/* PIN Code */}
                    <div>
                      <label
                        htmlFor="pincode"
                        className="block text-sm font-semibold text-[#203B2B]"
                      >
                        PIN Code (6 digits) <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="pincode"
                        name="pincode"
                        type="text"
                        maxLength={6}
                        required
                        value={formData.pincode}
                        onChange={handleChange}
                        placeholder="e.g. 141001"
                        className="mt-1.5 w-full min-h-12 rounded-xl border border-[#DCE4D6] bg-[#F9F8F2] px-4 text-sm font-mono text-[#203B2B] outline-none placeholder:text-[#89948A] focus:border-[#245B3F] focus:ring-2 focus:ring-[#A9C5A0]"
                      />
                    </div>

                    {/* Submit button */}
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#245B3F] px-6 py-3.5 font-semibold text-white transition hover:bg-[#19442D] disabled:opacity-60 shadow-md"
                    >
                      {loading ? (
                        "Generating Krishi ID & Registering..."
                      ) : (
                        <>
                          <span>Submit & Generate Krishi ID</span>
                          <span>↗</span>
                        </>
                      )}
                    </button>
                  </form>

                  {/* Login Link */}
                  <div className="mt-8 border-t border-[#E0E6DA] pt-6 text-center">
                    <p className="text-sm text-[#607064]">
                      Already have a registered Krishi ID?{" "}
                      <Link
                        href="/login"
                        className="font-semibold text-[#245B3F] hover:underline"
                      >
                        Log in with OTP
                      </Link>
                    </p>
                  </div>
                </>
              )}
            </div>
          </Reveal>
        </div>
      </section>
    </main>
  );
}
