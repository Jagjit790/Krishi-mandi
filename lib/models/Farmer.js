import mongoose from "mongoose";

const FarmerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    state: {
      type: String,
      required: [true, "State is required"],
      trim: true,
      default: "Punjab",
    },
    district: {
      type: String,
      required: [true, "District is required"],
      trim: true,
    },
    pincode: {
      type: String,
      required: [true, "PIN code is required"],
      trim: true,
      match: [/^[1-9][0-9]{5}$/, "Please enter a valid 6-digit Indian PIN code"],
    },
    village: {
      type: String,
      required: [true, "Village is required"],
      trim: true,
    },
    block: {
      type: String,
      required: [true, "Block / Tehsil is required"],
      trim: true,
    },
    krishiId: {
      type: String,
      required: [true, "Krishi ID is required"],
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    otp: {
      code: {
        type: String,
        default: null,
      },
      expiresAt: {
        type: Date,
        default: null,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Prevent re-compiling model in Next.js development hot reloading
const Farmer = mongoose.models.Farmer || mongoose.model("Farmer", FarmerSchema);

export default Farmer;
