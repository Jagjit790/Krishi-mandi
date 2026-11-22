"use client";

import { useAuth } from "../context/AuthContext";
import Link from "next/link";

export default function FarmerWelcomeBanner() {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return (
      <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#C8D6BF] bg-white/60 px-4 py-2 text-sm">
        <span className="h-2 w-2 rounded-full bg-[#56815D]" />
        Smarter decisions for better farming • Krishi Saathi
      </div>
    );
  }

  return (
    <div className="mb-6 inline-flex flex-wrap items-center gap-2.5 rounded-2xl border border-[#A9C5A0] bg-[#EAF2E6] px-4 py-2.5 text-sm shadow-sm">
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#245B3F] text-xs text-white">
        ✓
      </span>
      <span className="font-semibold text-[#203B2B]">
        Namaste, {user.name}!
      </span>
      <span className="rounded-lg bg-white/80 px-2 py-0.5 text-xs font-mono font-bold text-[#245B3F] border border-[#C8D6BF]">
        Krishi ID: {user.krishiId}
      </span>
      <span className="text-xs text-[#607064] hidden sm:inline">
        📍 {user.village}, {user.district} ({user.state})
      </span>
      <Link
        href="/profile"
        className="text-xs font-semibold text-[#245B3F] hover:underline ml-1"
      >
        View Profile →
      </Link>
    </div>
  );
}
