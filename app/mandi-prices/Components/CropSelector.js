
export default function CropSelector({
  crop,
  onCropChange,
  crops,
  cropsStatus,
  district,
  status,
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <select
        id="crop-search"
        value={crop}
        onChange={(event) => onCropChange(event.target.value)}
        disabled={
          !district ||
          cropsStatus === "loading" ||
          cropsStatus === "error" ||
          crops.length === 0
        }
        className="min-h-14 w-full rounded-xl border border-[#DCE4D6] bg-white px-5 text-base text-[#203B2B] outline-none focus:ring-2 focus:ring-[#A9C5A0] disabled:cursor-not-allowed disabled:bg-gray-100 sm:flex-1"
        required
      >
        <option value="">
          {!district
            ? "Select your district first"
            : cropsStatus === "loading"
            ? "Loading available crops..."
            : cropsStatus === "error"
            ? "Unable to load crops"
            : crops.length === 0
            ? "No crops available"
            : "Select a crop"}
        </option>

        {crops.map((item) => (
          <option key={item.code} value={item.name}>
            {item.name}
          </option>
        ))}
      </select>

      <button
        type="submit"
        disabled={status === "loading"}
        className="min-h-14 rounded-xl bg-[#245B3F] px-8 font-semibold text-white transition hover:bg-[#203B2B] disabled:cursor-wait disabled:opacity-60"
      >
        {status === "loading" ? "Searching…" : "Search prices"}
      </button>
    </div>
  );
}
