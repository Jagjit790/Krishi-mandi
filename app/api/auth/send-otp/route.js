import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Farmer from "@/lib/models/Farmer";

export async function POST(request) {
  try {
    const body = await request.json();
    const { krishiId } = body;

    if (!krishiId || !krishiId.trim()) {
      return NextResponse.json(
        { success: false, message: "Krishi ID is required to request an OTP." },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const normalizedKrishiId = krishiId.trim().toUpperCase();
    const farmer = await Farmer.findOne({ krishiId: normalizedKrishiId });

    if (!farmer) {
      return NextResponse.json(
        {
          success: false,
          message: `No farmer found with Krishi ID "${normalizedKrishiId}". Please verify your ID or sign up first.`,
        },
        { status: 404 }
      );
    }

    // Generate a 6-digit dummy OTP
    const dummyOtp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store OTP in database with 10-minute validity
    farmer.otp = {
      code: dummyOtp,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    };
    await farmer.save();

    return NextResponse.json({
      success: true,
      otp: dummyOtp,
      farmerName: farmer.name,
      krishiId: farmer.krishiId,
      message: `Dummy OTP sent for Krishi ID ${farmer.krishiId}`,
    });
  } catch (error) {
    console.error("Send OTP error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to generate OTP. Please try again.",
      },
      { status: 500 }
    );
  }
}
