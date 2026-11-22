import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import SearchedCrop from "@/lib/models/SearchedCrop";

export async function POST(request) {
  try {
    const body = await request.json();
    const { crop, district, krishiId, farmerName, records } = body;

    if (!crop || !district) {
      return NextResponse.json(
        { success: false, message: "Crop and district are required." },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const normalizedCrop = crop.trim();
    const normalizedDistrict = district.trim();
    const normalizedKrishiId = krishiId && krishiId.trim() ? krishiId.trim().toUpperCase() : "GUEST";
    const normalizedFarmerName = farmerName && farmerName.trim() ? farmerName.trim() : "Guest Farmer";

    // Extract summary numbers from records if available
    let modalPrice = null;
    let minPrice = null;
    let maxPrice = null;
    let market = "Local Mandi";
    let arrivalDate = "";
    let cleanRecords = [];

    if (Array.isArray(records) && records.length > 0) {
      cleanRecords = records.slice(0, 15);
      const firstValid = records.find((r) => Number.isFinite(Number(r.Modal_Price)));
      if (firstValid) {
        modalPrice = Math.round(Number(firstValid.Modal_Price));
        market = firstValid.Market || market;
        arrivalDate = firstValid.Arrival_Date || arrivalDate;
      }

      const validMins = records
        .map((r) => Number(r.Min_Price))
        .filter((n) => Number.isFinite(n) && n > 0);
      if (validMins.length > 0) {
        minPrice = Math.min(...validMins);
      }

      const validMaxs = records
        .map((r) => Number(r.Max_Price))
        .filter((n) => Number.isFinite(n) && n > 0);
      if (validMaxs.length > 0) {
        maxPrice = Math.max(...validMaxs);
      }
    }

    // Upsert or create searched crop
    const existing = await SearchedCrop.findOne({
      krishiId: normalizedKrishiId,
      crop: new RegExp(`^${normalizedCrop}$`, "i"),
      district: new RegExp(`^${normalizedDistrict}$`, "i"),
    });

    let savedCrop;

    if (existing) {
      existing.searchCount = (existing.searchCount || 1) + 1;
      existing.lastSearchedAt = new Date();
      if (modalPrice) existing.modalPrice = modalPrice;
      if (minPrice) existing.minPrice = minPrice;
      if (maxPrice) existing.maxPrice = maxPrice;
      if (market) existing.market = market;
      if (arrivalDate) existing.arrivalDate = arrivalDate;
      if (cleanRecords.length > 0) {
        existing.rawRecords = cleanRecords;
        existing.recordsCount = cleanRecords.length;
      }
      if (normalizedFarmerName && normalizedFarmerName !== "Guest Farmer") {
        existing.farmerName = normalizedFarmerName;
      }
      savedCrop = await existing.save();
    } else {
      savedCrop = await SearchedCrop.create({
        krishiId: normalizedKrishiId,
        farmerName: normalizedFarmerName,
        crop: normalizedCrop,
        district: normalizedDistrict,
        modalPrice,
        minPrice,
        maxPrice,
        market,
        arrivalDate,
        recordsCount: cleanRecords.length,
        rawRecords: cleanRecords,
        searchCount: 1,
        lastSearchedAt: new Date(),
      });
    }

    return NextResponse.json({
      success: true,
      message: "Searched crop saved to database successfully.",
      crop: savedCrop,
    });
  } catch (error) {
    console.error("Save searched crop error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to save searched crop." },
      { status: 500 }
    );
  }
}
