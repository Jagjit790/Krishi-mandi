"use client";

import Link from "next/link";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();

  return (
    <header className="border-b border-[#DCE4D6] bg-[#F5F1E6]/95 backdrop-blur-sm sticky top-0 z-40">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6 sm:py-4 lg:px-12">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#245B3F] text-xl text-white shadow-sm">
            🌾
          </span>
          <span className="text-xl font-bold tracking-tight text-[#203B2B]">
            Krishi Saathi
          </span>
        </Link>

        {/* Main Desktop Navigation Links */}
        <nav className="hidden items-center gap-6 text-sm font-medium text-[#203B2B] md:flex">
          <Link href="/mandi-prices" className="transition hover:text-[#56815D]">
            Mandi Prices
          </Link>
          <Link href="/your-crops"  className="transition hover:text-[#56815D]">
            Your Crops
          </Link>
          <Link href="/crop-suggestions" className="transition hover:text-[#56815D]">
            Crop Suggestions
          </Link>
          <Link href="/smart-mandi-finder" className="transition hover:text-[#56815D]">
            Smart Finder
          </Link>
          {isAuthenticated && (
            <Link
              href="/profile"
              className="flex items-center gap-1.5 rounded-full bg-[#E8F0E4] border border-[#A9C5A0] px-3.5 py-1.5 text-xs font-bold text-[#245B3F] transition hover:bg-[#D9E6D4]"
            >
              <span>👤</span>
              <span>Profile Details</span>
            </Link>
          )}
        </nav>

        {/* Auth Action Buttons */}
        <div className="flex items-center gap-2 sm:gap-3">
          {isAuthenticated && user ? (
            /* Logged in state: Show Profile button and Logout button. Login/Signup are hidden */
            <div className="flex items-center gap-2 sm:gap-3">
              <Link
                href="/profile"
                className="flex items-center gap-2 rounded-full border border-[#245B3F] bg-[#E8F0E4] px-3.5 py-1.5 text-xs sm:text-sm font-bold text-[#245B3F] shadow-sm transition hover:bg-[#D9E6D4]"
                title="Click to view your farmer profile"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#245B3F] text-xs font-bold text-white">
                  {user.name ? user.name[0].toUpperCase() : "👤"}
                </span>
                <span>Profile</span>
                <span className="rounded-md bg-white/80 px-1.5 py-0.5 text-[11px] font-mono font-semibold text-[#203B2B] hidden sm:inline">
                  {user.krishiId}
                </span>
              </Link>

              {/* Logout Button */}
              <button
                type="button"
                onClick={logout}
                className="flex items-center gap-1.5 rounded-full border border-[#E0C5BF] bg-[#FDF4F2] px-3.5 py-1.5 text-xs sm:text-sm font-bold text-[#8B3A2B] shadow-sm transition hover:bg-[#F9E2DD] hover:border-[#D6AFA7]"
              >
                <span>🚪</span>
                <span className="hidden xs:inline">Log Out</span>
                <span className="xs:hidden">Exit</span>
              </button>
            </div>
          ) : (
            /* Logged out state: Show Login and Sign Up buttons */
            <div className="flex items-center gap-2 sm:gap-3">
              <Link
                href="/login"
                className="rounded-full border border-[#C8D6BF] bg-white/70 px-4 py-2 text-xs sm:text-sm font-semibold text-[#203B2B] transition hover:bg-white"
              >
                Login
              </Link>
              <Link
                href="/signup"
                className="rounded-full bg-[#245B3F] px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-sm transition hover:bg-[#19442D]"
              >
                Sign Up ↗
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Mobile sub-navigation bar */}
      <div className="flex md:hidden items-center justify-around border-t border-[#DCE4D6] bg-[#F5F1E6] px-3 py-2 text-xs font-semibold text-[#203B2B]">
        <Link href="/mandi-prices" className="hover:text-[#56815D]">
          Prices
        </Link>
        <Link href="/your-crops" className="text-[#245B3F] font-bold">
          🌱 Your Crops
        </Link>
        <Link href="/crop-suggestions" className="hover:text-[#56815D]">
          Crops
        </Link>
        {isAuthenticated ? (
          <Link href="/profile" className="hover:text-[#56815D]">
            👤 Profile
          </Link>
        ) : (
          <Link href="/login" className="hover:text-[#56815D]">
            Login
          </Link>
        )}
      </div>
    </header>
  );
}
