export default function MarketRecords({
  cropRecords,
  selectedCrop,
  formatPrice,
}) {
  return (
    <div>
      <h2 className="text-2xl font-bold">
        Market records
      </h2>

      <p className="mt-2 text-sm text-[#607064]">
        {cropRecords.length} records available for {selectedCrop}.
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cropRecords.map((record, index) => (
          <article
            key={`${record.Market}-${record.Arrival_Date}-${index}`}
            className="rounded-2xl border border-[#DCE4D6] bg-white p-5 shadow-sm"
          >
            <p className="text-sm text-[#607064]">
              {record.Market || "Market not specified"}
            </p>

            <h3 className="mt-1 text-xl font-bold">
              {record.Commodity}
            </h3>

            <p className="mt-1 text-sm text-[#607064]">
              {record.District}
              {record.Variety ? ` · ${record.Variety}` : ""}
            </p>

            <div className="mt-5 grid grid-cols-3 gap-2 border-t border-[#E8EFE3] pt-4">
              {[
                ["Minimum", record.Min_Price],
                ["Modal", record.Modal_Price],
                ["Maximum", record.Max_Price],
              ].map(([label, value]) => (
                <div key={label}>
                  <p className="text-xs text-[#607064]">
                    {label}
                  </p>

                  <p className="mt-1 font-semibold">
                    {formatPrice(value)}
                  </p>
                </div>
              ))}
            </div>

            <p className="mt-4 rounded-lg bg-[#F5F1E6] px-3 py-2 text-xs text-[#607064]">
              Arrival date: {record.Arrival_Date || "Not provided"}
            </p>
          </article>
        ))}
      </div>
    </div>
  );
}
