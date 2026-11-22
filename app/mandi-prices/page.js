
import Link from "next/link";
import MandiPriceSearch from "./MandiPriceSearch";
import Navbar from "../Components/Navbar";

export const metadata = {
  title: "Mandi Prices | Krishi Saathi",
  description:
    "Check reported agricultural market prices across Punjab with Krishi Saathi.",
};

export default async function MandiPricesPage({ searchParams }) {
  // Supports links like /mandi-prices?crop=Wheat&district=Ludhiana
  const params = await searchParams;
  const initialCrop =
    typeof params?.crop === "string" ? params.crop.trim().slice(0, 80) : "";
  const initialDistrict =
    typeof params?.district === "string" ? params.district.trim() : "";

  return (
    <main className="min-h-screen bg-[#F5F1E6] text-[#203B2B]">
      {/* Header */}
      <Navbar />

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
        <MandiPriceSearch
          initialCrop={initialCrop}
          initialDistrict={initialDistrict}
        />

        {/* Nearby mandi section */}
        {/* <section
          className="mt-10 rounded-2xl border border-[#DCE4D6] bg-[#E8EFE3] p-5 sm:p-7"
          aria-labelledby="nearby-mandis-heading"
        >
          <div className="flex items-start gap-3">
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-xl"
              aria-hidden="true"
            >
              📍
            </div>

            <div>
              <h2
                id="nearby-mandis-heading"
                className="text-lg font-semibold"
              >
                Explore nearby mandis
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#526653]">
                We’re working toward verified mandi locations and
                location-based market recommendations. Until then, you can
                choose a district or search for a crop to explore available
                government-reported market prices.
              </p>
            </div>
          </div>
        </section> */}

        {/* Data source information */}
        <p className="mt-8 text-center text-xs leading-5 text-[#718071]">
          Market prices are based on available government-reported data.
          Reported prices and arrival dates may vary by market.
        </p>
      </section>
    </main>
  );
}