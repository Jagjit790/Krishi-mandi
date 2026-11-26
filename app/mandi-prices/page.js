
import Link from "next/link";
import MandiPriceSearch from "./MandiPriceSearch";

export const metadata = {
  title: "Mandi Prices",
  description:
    "Check reported agricultural market prices across Punjab with Krishi Saathi.",
};

export default function MandiPricesPage() {
  return (
    <main className="min-h-screen bg-[#F5F1E6] text-[#203B2B]">
      {/* Header */}
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

      {/* Main content */}
      <section className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14">
        <div className="max-w-3xl">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-[#557A4D]">
            Your crops. Your market. Your choice.
          </p>

          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Mandi Prices
          </h1>

          <p className="mt-4 max-w-2xl text-base leading-7 text-[#607064] sm:text-lg">
            Compare reported agricultural market prices and explore markets
            across Punjab to make more informed selling decisions.
          </p>
        </div>

        {/* Search and results are handled by the client component */}
        <MandiPriceSearch />
        
        {/* Data source information */}
        <p className="mt-8 text-center text-xs leading-5 text-[#718071]">
          Market prices are based on available government-reported data.
          Reported prices and arrival dates may vary by market.
        </p>
      </section>
    </main>
  );
}
