"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import Reveal from "../Components/Reveal";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [krishiId, setKrishiId] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState(1); // 1 = Enter Krishi ID, 2 = Enter OTP
  const [alertedOtp, setAlertedOtp] = useState(null);
  const [farmerName, setFarmerName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const queryId = params.get("krishiId");
      if (queryId) {
        queueMicrotask(() => {
          setKrishiId(queryId.toUpperCase());
        });
      }
    }
  }, []);

  // Request dummy OTP
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    const cleanId = krishiId.trim().toUpperCase();
    if (!cleanId) {
      setError("Please enter your Krishi ID.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ krishiId: cleanId }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to generate OTP.");
      }

      setAlertedOtp(data.otp);
      setFarmerName(data.farmerName || "");
      setStep(2);
      setMessage(`Dummy OTP generated for Krishi ID ${cleanId}!`);

      // Alert the dummy OTP as requested
      setTimeout(() => {
        alert(
          `🌾 Krishi Saathi Login Verification\n\nNamaste ${data.farmerName || ""}!\nYour Dummy Login OTP for Krishi ID "${cleanId}" is: ${data.otp}\n\nPlease enter this OTP on the screen to complete your login.`
        );
      }, 100);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Verify OTP and complete login
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!otp.trim()) {
      setError("Please enter the 6-digit OTP alerted to you.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          krishiId: krishiId.trim().toUpperCase(),
          otp: otp.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Invalid OTP. Please try again.");
      }

      // Store in auth context and localStorage
      login(data.farmer);

      alert(`🌾 Login Successful!\n\nWelcome back, ${data.farmer.name}!\nLogged in with Krishi ID: ${data.farmer.krishiId}`);

      router.push("/profile");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
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

      {/* Main Container */}
      <section className="flex-1 flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          <Reveal y={25}>
            <div className="rounded-3xl border border-[#DCE4D6] bg-white p-7 shadow-xl sm:p-10">
              <div className="text-center">
                <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#E3EBDD] text-2xl text-[#245B3F]">
                  🌾
                </span>
                <p className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-[#56815D]">
                  Farmer Portal
                </p>
                <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
                  Log in to Krishi Saathi
                </h1>
                <p className="mt-2 text-sm text-[#607064]">
                  Access mandi prices, crop intelligence, and customized local recommendations.
                </p>
              </div>

              {/* Status & Error messages */}
              {error && (
                <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  <p className="font-semibold">⚠️ Notice</p>
                  <p className="mt-1">{error}</p>
                </div>
              )}

              {/* Alerted Dummy OTP notification banner */}
              {alertedOtp && (
                <div className="mt-6 rounded-2xl border border-[#C8D6BF] bg-[#F5F9F2] p-4 text-sm text-[#203B2B]">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-[#245B3F] flex items-center gap-1.5">
                        <span>📲</span> Alerted Dummy OTP
                      </p>
                      <p className="mt-1 text-xs text-[#607064]">
                        Use this alerted OTP to verify your login:
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setOtp(alertedOtp)}
                      className="rounded-lg bg-[#245B3F] px-2.5 py-1 text-xs font-medium text-white transition hover:bg-[#19442D]"
                    >
                      Auto-fill
                    </button>
                  </div>
                  <div className="mt-2 flex items-center justify-center rounded-xl bg-white p-2.5 font-mono text-xl font-bold tracking-widest text-[#245B3F] border border-[#DCE4D6]">
                    {alertedOtp}
                  </div>
                </div>
              )}

              {step === 1 ? (
                /* Step 1: Enter Krishi ID */
                <form onSubmit={handleRequestOtp} className="mt-6 space-y-5">
                  <div>
                    <label
                      htmlFor="krishiId"
                      className="block text-sm font-semibold text-[#203B2B]"
                    >
                      Krishi ID <span className="text-red-500">*</span>
                    </label>
                    <p className="text-xs text-[#718074] mt-0.5 mb-2">
                      Enter your unique registered farmer ID (e.g. KID-10293)
                    </p>
                    <div className="relative">
                      <input
                        id="krishiId"
                        type="text"
                        required
                        value={krishiId}
                        onChange={(e) => setKrishiId(e.target.value.toUpperCase())}
                        placeholder="e.g. KID-10293"
                        className="w-full uppercase min-h-12 rounded-xl border border-[#DCE4D6] bg-[#F9F8F2] px-4 font-mono text-base font-medium text-[#203B2B] outline-none placeholder:text-[#89948A] focus:border-[#245B3F] focus:ring-2 focus:ring-[#A9C5A0]"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#245B3F] px-6 py-3 font-semibold text-white transition hover:bg-[#19442D] disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
                  >
                    {loading ? (
                      <span>Checking Krishi ID...</span>
                    ) : (
                      <>
                        <span>Get Alerted Dummy OTP</span>
                        <span>→</span>
                      </>
                    )}
                  </button>
                </form>
              ) : (
                /* Step 2: Enter OTP */
                <form onSubmit={handleVerifyOtp} className="mt-6 space-y-5">
                  <div>
                    <div className="flex items-center justify-between">
                      <label
                        htmlFor="otp"
                        className="block text-sm font-semibold text-[#203B2B]"
                      >
                        Enter 6-Digit OTP <span className="text-red-500">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setStep(1);
                          setAlertedOtp(null);
                        }}
                        className="text-xs font-medium text-[#56815D] hover:underline"
                      >
                        Change Krishi ID
                      </button>
                    </div>
                    <p className="text-xs text-[#718074] mt-0.5 mb-2">
                      Check your browser alert or the banner above for the dummy OTP.
                    </p>
                    <input
                      id="otp"
                      type="text"
                      maxLength={6}
                      required
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      placeholder="Enter 6-digit OTP"
                      className="w-full text-center tracking-widest font-mono text-xl min-h-12 rounded-xl border border-[#DCE4D6] bg-[#F9F8F2] px-4 text-[#203B2B] outline-none focus:border-[#245B3F] focus:ring-2 focus:ring-[#A9C5A0]"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#245B3F] px-6 py-3 font-semibold text-white transition hover:bg-[#19442D] disabled:opacity-60 shadow-sm"
                    >
                      {loading ? "Verifying OTP..." : "Verify & Log In →"}
                    </button>

                    <button
                      type="button"
                      onClick={handleRequestOtp}
                      disabled={loading}
                      className="w-full py-2 text-xs font-medium text-[#56815D] hover:text-[#245B3F] text-center"
                    >
                      Didn&apos;t get the alert? Resend Dummy OTP
                    </button>
                  </div>
                </form>
              )}

              {/* Sign Up Link */}
              <div className="mt-8 border-t border-[#E0E6DA] pt-6 text-center">
                <p className="text-sm text-[#607064]">
                  Don&apos;t have a Krishi ID yet?{" "}
                  <Link
                    href="/signup"
                    className="font-semibold text-[#245B3F] hover:underline"
                  >
                    Sign up now
                  </Link>
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </main>
  );
}
