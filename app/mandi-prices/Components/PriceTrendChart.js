
export default function PriceTrendChart({
  selectedCrop,
  trendData,
  trendMax,
  formatPrice,
  formatDate,
}) {
  return (
    <div>
      <h2 className="text-2xl font-bold">
        How have prices changed?
      </h2>

      <p className="mt-2 text-sm text-[#607064]">
        {selectedCrop} · Reported modal prices by arrival date
      </p>

      <div className="mt-5 rounded-2xl border border-[#DCE4D6] bg-white p-5 sm:p-7">
        {trendData.length >= 2 ? (
          <>
            <div className="flex h-52 items-end justify-around gap-3 border-b border-[#DCE4D6] pb-2">
              {trendData.map((item) => (
                <div
                  key={item.date.toISOString()}
                  className="flex h-full flex-1 flex-col items-center justify-end gap-2"
                >
                  <span className="text-xs font-semibold text-[#245B3F]">
                    {formatPrice(item.price)}
                  </span>

                  <div
                    className="w-full max-w-12 rounded-t-lg bg-[#78A66A]"
                    style={{
                      height: `${Math.max(
                        8,
                        (item.price / trendMax) * 125
                      )}px`,
                    }}
                    title={`${formatDate(item.date)}: ${formatPrice(item.price)}`}
                  />

                  <span className="text-center text-[10px] text-[#607064]">
                    {item.date.toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                    })}
                  </span>
                </div>
              ))}
            </div>

            <p className="mt-4 text-xs text-[#718071]">
              Based on available government-reported records.
              Each value represents the average modal price
              of the returned records for that date.
            </p>
          </>
        ) : (
          <div className="py-8 text-center">
            <span className="text-3xl">📊</span>

            <p className="mt-3 font-semibold">
              Historical trend not available yet
            </p>

            <p className="mt-2 text-sm text-[#607064]">
              We need records from at least two different
              arrival dates to show a meaningful price trend.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
