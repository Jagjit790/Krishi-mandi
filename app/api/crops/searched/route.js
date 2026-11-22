import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import SearchedCrop from "@/lib/models/SearchedCrop";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const krishiId = searchParams.get("krishiId");
    const limit = Math.min(Number(searchParams.get("limit") || 30), 50);

    await connectToDatabase();

    let query = {};
    if (krishiId && krishiId.trim()) {
      const normalizedId = krishiId.trim().toUpperCase();
      // Show user's own crops first, plus any recent public/guest crops if user has none
      query = {
        $or: [{ krishiId: normalizedId }, { krishiId: "GUEST" }],
      };
    }

    const crops = await SearchedCrop.find(query)
      .sort({ lastSearchedAt: -1 })
      .limit(limit)
      .lean();

    return NextResponse.json({
      success: true,
      count: crops.length,
      crops,
    });
  } catch (error) {
    console.error("Get searched crops error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch searched crops." },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Crop ID is required to delete." },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const deleted = await SearchedCrop.findByIdAndDelete(id);

    if (!deleted) {
      return NextResponse.json(
        { success: false, message: "Crop record not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Removed ${deleted.crop} from Your Crops.`,
    });
  } catch (error) {
    console.error("Delete searched crop error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to delete crop." },
      { status: 500 }
    );
  }
}
