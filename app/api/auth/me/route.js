import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Farmer from "@/lib/models/Farmer";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const krishiId = searchParams.get("krishiId");

    if (!krishiId) {
      return NextResponse.json(
        { success: false, message: "Krishi ID parameter is required." },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const farmer = await Farmer.findOne({ krishiId: krishiId.trim().toUpperCase() }).select("-otp");

    if (!farmer) {
      return NextResponse.json(
        { success: false, message: "Farmer not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      farmer: {
        id: farmer._id,
        name: farmer.name,
        krishiId: farmer.krishiId,
        state: farmer.state,
        district: farmer.district,
        pincode: farmer.pincode,
        village: farmer.village,
        block: farmer.block,
      },
    });
  } catch (error) {
    console.error("Get farmer error:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
