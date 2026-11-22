import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Farmer from "@/lib/models/Farmer";

export async function POST(request) {
  try {
    const body = await request.json();
    const { krishiId, otp } = body;

    if (!krishiId || !krishiId.trim()) {
      return NextResponse.json(
        { success: false, message: "Krishi ID is required." },
        { status: 400 }
      );
    }

    if (!otp || !otp.trim()) {
      return NextResponse.json(
        { success: false, message: "OTP is required to log in." },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const normalizedKrishiId = krishiId.trim().toUpperCase();
    const cleanOtp = otp.trim();

    const farmer = await Farmer.findOne({ krishiId: normalizedKrishiId });

    if (!farmer) {
      return NextResponse.json(
        {
          success: false,
          message: `No farmer found with Krishi ID "${normalizedKrishiId}". Please sign up first.`,
        },
        { status: 404 }
      );
    }

    // Verify OTP
    const isOtpValid =
      (farmer.otp?.code &&
        farmer.otp.code === cleanOtp &&
        farmer.otp.expiresAt &&
        new Date(farmer.otp.expiresAt) > new Date()) ||
      cleanOtp === "123456"; // Default testing fallback

    if (!isOtpValid) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid or expired OTP. Please check the alerted OTP and try again.",
        },
        { status: 401 }
      );
    }

    // Clear the OTP once verified
    farmer.otp = { code: null, expiresAt: null };
    await farmer.save();

    return NextResponse.json({
      success: true,
      message: `Welcome back, ${farmer.name}!`,
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
    console.error("Login error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Login failed. Please try again.",
      },
      { status: 500 }
    );
  }
}
