"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import Navbar from "../Components/Navbar";
import Reveal from "../Components/Reveal";

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth();
  const [copied, setCopied] = useState(false);

  const handleCopyId = () => {
    if (user?.krishiId) {
      navigator.clipboard.writeText(user.krishiId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  return (
    <main className="min-h-screen bg-[#F5F1E6] text-[#203B2B] flex flex-col">
      <div className="border-b border-[#DCE4D6]">
        <Navbar />
      </div>

      <section className="flex-1 mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        {!isAuthenticated || !user ? (
          /* Not logged in view */
          <Reveal y={20}>
            <div className="rounded-3xl border border-[#DCE4D6] bg-white p-8 sm:p-12 text-center shadow-lg max-w-lg mx-auto">
              <span className="flex h-16 w-16 mx-auto items-center justify-center rounded-2xl bg-[#E3EBDD] text-3xl text-[#245B3F]">
                🔒
              </span>
              <h1 className="mt-4 text-2xl font-bold tracking-tight text-[#203B2B] sm:text-3xl">
                Farmer Profile Access
              </h1>
              <p className="mt-2 text-sm text-[#607064]">
                You are not currently logged in. Please log in with your Krishi ID and OTP to view your farmer details.
              </p>
              <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  href="/login"
                  className="rounded-xl bg-[#245B3F] px-6 py-3 font-semibold text-white transition hover:bg-[#19442D] shadow-sm"
                >
                  Log In with Krishi ID →
                </Link>
                <Link
                  href="/signup"
                  className="rounded-xl border border-[#C8D6BF] bg-white px-6 py-3 font-semibold text-[#203B2B] transition hover:bg-[#F5F1E6]"
                >
                  Sign Up
                </Link>
              </div>
            </div>
          </Reveal>
        ) : (
          /* Logged in farmer profile view */
          <div className="space-y-8">
            <Reveal y={15}>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-[#C8D6BF] bg-white/70 px-3.5 py-1 text-xs font-semibold text-[#56815D]">
                    <span className="h-2 w-2 rounded-full bg-[#245B3F]" />
                    Verified Farmer Account
                  </div>
                  <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl text-[#203B2B]">
                    Farmer Profile
                  </h1>
                  <p className="mt-1 text-sm text-[#607064]">
                    Review your registered agricultural details, location, and identifier.
                  </p>
                </div>

                {/* Prominent Log Out Button */}
                <button
                  onClick={handleLogout}
                  className="self-start sm:self-auto flex items-center gap-2 rounded-xl border border-[#E0C5BF] bg-[#FDF4F2] px-4 py-2.5 text-sm font-semibold text-[#8B3A2B] shadow-sm transition hover:bg-[#F9E2DD]"
                >
                  <span>🚪</span>
                  <span>Log Out</span>
                </button>
              </div>
            </Reveal>

            {/* Main Profile Card */}
            <Reveal y={25} delay={0.1}>
              <div className="rounded-3xl border border-[#DCE4D6] bg-white p-6 sm:p-10 shadow-lg">
                {/* Farmer Header Info */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-[#E0E6DA]">
                  <div className="flex items-center gap-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#245B3F] text-2xl font-bold text-white shadow-md">
                      {user.name ? user.name[0].toUpperCase() : "K"}
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-[#203B2B]">
                        {user.name}
                      </h2>
                      <p className="text-sm text-[#607064]">
                        📍 {user.village}, {user.district} ({user.state})
                      </p>
                    </div>
                  </div>

                  {/* Highlighted Krishi ID with Copy Button */}
                  <div className="rounded-2xl border border-[#C8D6BF] bg-[#F5F9F2] p-4 text-center sm:text-right">
                    <p className="text-xs font-semibold uppercase tracking-wider text-[#56815D]">
                      Krishi ID
                    </p>
                    <div className="mt-1 flex items-center justify-center sm:justify-end gap-2">
                      <span className="font-mono text-xl sm:text-2xl font-extrabold tracking-wider text-[#245B3F]">
                        {user.krishiId}
                      </span>
                      <button
                        type="button"
                        onClick={handleCopyId}
                        className="rounded-lg border border-[#C8D6BF] bg-white px-2.5 py-1 text-xs font-semibold text-[#245B3F] shadow-sm hover:bg-[#E3EBDD] transition"
                        title="Copy Krishi ID"
                      >
                        {copied ? "✓ Copied" : "📋 Copy"}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Detailed Information Grid */}
                <div className="mt-8">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-[#56815D] mb-4">
                    Agricultural & Location Details
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="rounded-2xl border border-[#E0E6DA] bg-[#F9F8F2] p-4">
                      <p className="text-xs text-[#718074]">Farmer Full Name</p>
                      <p className="mt-1 text-base font-semibold text-[#203B2B]">{user.name}</p>
                    </div>

                    <div className="rounded-2xl border border-[#E0E6DA] bg-[#F9F8F2] p-4">
                      <p className="text-xs text-[#718074]">Krishi Saathi ID</p>
                      <p className="mt-1 text-base font-mono font-bold text-[#245B3F]">{user.krishiId}</p>
                    </div>

                    <div className="rounded-2xl border border-[#E0E6DA] bg-[#F9F8F2] p-4">
                      <p className="text-xs text-[#718074]">State</p>
                      <p className="mt-1 text-base font-semibold text-[#203B2B]">{user.state}</p>
                    </div>

                    <div className="rounded-2xl border border-[#E0E6DA] bg-[#F9F8F2] p-4">
                      <p className="text-xs text-[#718074]">District</p>
                      <p className="mt-1 text-base font-semibold text-[#203B2B]">{user.district}</p>
                    </div>

                    <div className="rounded-2xl border border-[#E0E6DA] bg-[#F9F8F2] p-4">
                      <p className="text-xs text-[#718074]">Block / Tehsil</p>
                      <p className="mt-1 text-base font-semibold text-[#203B2B]">{user.block}</p>
                    </div>

                    <div className="rounded-2xl border border-[#E0E6DA] bg-[#F9F8F2] p-4">
                      <p className="text-xs text-[#718074]">Village Name</p>
                      <p className="mt-1 text-base font-semibold text-[#203B2B]">{user.village}</p>
                    </div>

                    <div className="rounded-2xl border border-[#E0E6DA] bg-[#F9F8F2] p-4">
                      <p className="text-xs text-[#718074]">Postal PIN Code</p>
                      <p className="mt-1 text-base font-mono font-semibold text-[#203B2B]">{user.pincode}</p>
                    </div>

                    <div className="rounded-2xl border border-[#E0E6DA] bg-[#F9F8F2] p-4">
                      <p className="text-xs text-[#718074]">Authentication Mode</p>
                      <p className="mt-1 text-base font-semibold text-[#203B2B]">Krishi ID + OTP</p>
                    </div>

                    <div className="rounded-2xl border border-[#E0E6DA] bg-[#F9F8F2] p-4">
                      <p className="text-xs text-[#718074]">Account Status</p>
                      <p className="mt-1 text-base font-semibold text-[#245B3F]">Active & Verified</p>
                    </div>
                  </div>
                </div>

                {/* Navigation Shortcuts */}
                <div className="mt-8 pt-6 border-t border-[#E0E6DA] flex flex-wrap gap-4 items-center justify-between">
                  <div className="flex flex-wrap gap-3">
                    <Link
                      href="/mandi-prices"
                      className="rounded-xl bg-[#245B3F] px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-sm transition hover:bg-[#19442D]"
                    >
                      Check Mandi Prices in {user.district} ↗
                    </Link>
                    <Link
                      href="/crop-suggestions"
                      className="rounded-xl border border-[#C8D6BF] bg-white px-4 py-2.5 text-xs sm:text-sm font-semibold text-[#203B2B] shadow-sm transition hover:bg-[#F5F1E6]"
                    >
                      Crop Suggestions ↗
                    </Link>
                  </div>

                  <button
                    onClick={handleLogout}
                    className="text-xs sm:text-sm font-semibold text-[#8B3A2B] hover:underline"
                  >
                    Log Out of Session
                  </button>
                </div>
              </div>
            </Reveal>
          </div>
        )}
      </section>
    </main>
  );
}
