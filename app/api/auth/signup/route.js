import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Farmer from "@/lib/models/Farmer";

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, state, district, pincode, village, block, krishiId: userProvidedId } = body;

    // Validate required fields (name, state, district, pincode, village, block)
    if (!name || !state || !district || !pincode || !village || !block) {
      return NextResponse.json(
        {
          success: false,
          message: "All fields are required: Name, State, District, PIN code, Village, and Block.",
        },
        { status: 400 }
      );
    }

    // Connect to database
    await connectToDatabase();

    let assignedKrishiId = "";

    if (userProvidedId && userProvidedId.trim()) {
      const normalizedId = userProvidedId.trim().toUpperCase();
      const existingFarmer = await Farmer.findOne({ krishiId: normalizedId });
      if (existingFarmer) {
        return NextResponse.json(
          {
            success: false,
            message: `Krishi ID "${normalizedId}" is already registered. Please login or leave empty to auto-generate.`,
          },
          { status: 409 }
        );
      }
      assignedKrishiId = normalizedId;
    } else {
      // Automatically generate a unique Krishi ID (e.g. KID-782910)
      let isUnique = false;
      let attempts = 0;

      while (!isUnique && attempts < 10) {
        const randomDigits = Math.floor(100000 + Math.random() * 900000);
        const candidateId = `KID-${randomDigits}`;
        const existing = await Farmer.findOne({ krishiId: candidateId });
        if (!existing) {
          assignedKrishiId = candidateId;
          isUnique = true;
          break;
        }
        attempts++;
      }

      // Fallback if needed
      if (!isUnique) {
        assignedKrishiId = `KID-${Date.now().toString().slice(-6)}`;
      }
    }

    // Create new Farmer in MongoDB via Mongoose
    const newFarmer = await Farmer.create({
      name: name.trim(),
      state: state.trim(),
      district: district.trim(),
      pincode: pincode.trim(),
      village: village.trim(),
      block: block.trim(),
      krishiId: assignedKrishiId,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Farmer registered and Krishi ID generated successfully!",
        farmer: {
          id: newFarmer._id,
          name: newFarmer.name,
          state: newFarmer.state,
          district: newFarmer.district,
          pincode: newFarmer.pincode,
          village: newFarmer.village,
          block: newFarmer.block,
          krishiId: newFarmer.krishiId,
          createdAt: newFarmer.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Signup error:", error);

    // Handle Mongoose validation errors
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((val) => val.message);
      return NextResponse.json(
        { success: false, message: messages.join(", ") },
        { status: 400 }
      );
    }

    // Handle Mongo duplicate key error (code 11000)
    if (error.code === 11000) {
      return NextResponse.json(
        {
          success: false,
          message: "A farmer with this Krishi ID is already registered.",
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to complete registration. Please try again.",
      },
      { status: 500 }
    );
  }
}
