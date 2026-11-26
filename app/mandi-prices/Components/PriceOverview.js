
export default function PriceOverview({
  selectedCrop,
  latestDate,
  latestCropRecords,
  formatDate,
  formatPrice,
}) {
  const latestPrices = {
    minimum: latestCropRecords.length
      ? Math.min(
          ...latestCropRecords
            .map((record) => Number(record.Min_Price))
            .filter(Number.isFinite)
        )
      : null,

    modal: latestCropRecords.length
      ? Math.round(
          latestCropRecords.reduce(
            (sum, record) =>
              sum + Number(record.Modal_Price),
            0
          ) / latestCropRecords.length
        )
      : null,

    maximum: latestCropRecords.length
      ? Math.max(
          ...latestCropRecords
            .map((record) => Number(record.Max_Price))
            .filter(Number.isFinite)
        )
      : null,
  };
  
  return (
    <div className="rounded-2xl border border-[#DCE4D6] bg-white mt-5 p-5 sm:p-7">
      <p className="text-sm text-[#607064]">
        Selected crop
      </p>

      <h3 className="mt-2 text-2xl font-bold">
        {selectedCrop} 🌾
      </h3>

      <p className="mt-1 text-sm text-[#607064]">
        Prices per quintal (100 kg)
      </p>

      {latestDate && (
        <p className="mt-3 text-xs text-[#718071]">
          Latest arrival date: {formatDate(latestDate)}
        </p>
      )}

      <div className="mt-5 grid grid-cols-3 gap-3">
        {[
          {
            label: "Minimum",
            value: latestCropRecords.length
              ? latestPrices.minimum
              : null,
          },
          {
            label: "Modal",
            value: latestPrices.modal,
          },
          {
            label: "Maximum",
            value: latestCropRecords.length
              ? latestPrices.maximum
              : null,
          },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-xl bg-[#F5F1E6] p-3"
          >
            <p className="text-xs text-[#607064]">
              {item.label}
            </p>

            <p className="mt-2 text-lg font-bold text-[#245B3F]">
              {item.value !== null && Number.isFinite(item.value)
                ? formatPrice(item.value)
                : "—"}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
