
export default function MandiComparison({
  selectedCrop,
  district,
  mandiComparisons,
  formatPrice,
  formatDate,
}) {
  return (
    <div>
      <h2 className="text-2xl font-bold">
        Compare mandis
      </h2>

      <p className="mt-2 text-sm text-[#607064]">
        Compare reported modal prices for {selectedCrop} in{" "}
        {district || "Punjab"}.
      </p>

      {mandiComparisons.length >= 2 ? (
        <>
          {/* Two or more mandis */}
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {mandiComparisons.slice(0, 2).map((mandi, index) => (
              <div
                key={mandi.name}
                className="rounded-2xl border border-[#DCE4D6] bg-white p-5"
              >
                <p className="text-sm text-[#607064]">
                  {index === 0
                    ? "Best reported price"
                    : "Other market"}
                </p>

                <h3 className="mt-2 text-lg font-semibold">
                  {mandi.name}
                </h3>

                <p className="mt-3 text-3xl font-bold text-[#245B3F]">
                  {formatPrice(mandi.price)}
                </p>

                <p className="mt-1 text-xs text-[#607064]">
                  Per quintal · Modal price
                </p>

                <p className="mt-2 text-xs text-[#718071]">
                  <strong>Reported on:</strong>{" "}
                  {formatDate(mandi.arrivalDate)}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-xl bg-[#E8EFE3] p-4 text-sm text-[#203B2B]">
            {mandiComparisons[0].name} reports{" "}
            {formatPrice(
              mandiComparisons[0].price -
                mandiComparisons[1].price
            )}{" "}
            more per quintal than {mandiComparisons[1].name}.
          </div>
        </>
      ) : mandiComparisons.length === 1 ? (
        <>
          {/* Exactly one mandi */}
          <div className="mt-5 rounded-2xl border border-[#DCE4D6] bg-white p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-lg font-bold">
                {mandiComparisons[0].name}
              </h3>

              <span className="rounded-full bg-[#E5EBDD] px-3 py-1.5 text-xs font-semibold text-[#245B3F]">
                Best available price
              </span>
            </div>

            <p className="mt-2 text-sm text-[#607064]">
              {selectedCrop} · {mandiComparisons[0].district}
            </p>

            <p className="mt-4 text-3xl font-bold text-[#245B3F]">
              {formatPrice(mandiComparisons[0].price)}
            </p>

            <p className="mt-1 text-xs text-[#607064]">
              Modal price per quintal
            </p>

            <div className="mt-5 border-t border-[#E8EFE3] pt-4">
              <p className="text-sm text-[#607064]">
                Only one mandi has matching records. No other mandi
                is available for comparison yet.
              </p>
            </div>
          </div>
        </>
      ) : (
        /* No mandi records */
        <p className="mt-4 rounded-xl bg-white p-5 text-sm text-[#607064]">
          No mandi price records are available for comparison.
        </p>
      )}
    </div>
  );
}
