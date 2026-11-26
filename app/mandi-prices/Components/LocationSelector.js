
export default function LocationSelector({
  district,
  districts,
  onDistrictChange,
  onLocationSearch,
  locationMessage,
}) {
  return (
    <section className="mt-8 rounded-2xl border border-[#DCE4D6] bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-start gap-3">
        <span className="text-2xl" aria-hidden="true">
          📍
        </span>

        <div>
          <h2 className="text-lg font-semibold">
            Choose your location
          </h2>

          <p className="mt-1 text-sm leading-6 text-[#607064]">
            Search a district directly or use your location to help find
            markets near you.
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <button
          type="button"
          onClick={onLocationSearch}
          className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#245B3F] px-5 py-3 font-semibold text-white transition hover:bg-[#203B2B] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#245B3F]"
        >
          <span aria-hidden="true">◎</span>
          Use my current location
        </button>

        <label className="flex flex-col gap-2 text-sm font-medium">
          Select district

          <select
            value={district}
            onChange={(event) => onDistrictChange(event.target.value)}
            className="min-h-12 rounded-xl border border-[#DCE4D6] bg-[#F5F1E6] px-4 text-[#203B2B] outline-none focus:ring-2 focus:ring-[#A9C5A0]"
            required
          >
            <option value="">All Punjab districts</option>

            {districts.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {locationMessage && (
        <p
          role="status"
          className="mt-4 text-sm leading-6 text-[#607064]"
        >
          {locationMessage}
        </p>
      )}
    </section>
  );
}
