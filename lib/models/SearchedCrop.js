import mongoose from "mongoose";

const SearchedCropSchema = new mongoose.Schema(
  {
    krishiId: {
      type: String,
      default: "GUEST",
      index: true,
      trim: true,
      uppercase: true,
    },
    farmerName: {
      type: String,
      default: "Guest Farmer",
      trim: true,
    },
    crop: {
      type: String,
      required: [true, "Crop name is required"],
      trim: true,
      index: true,
    },
    district: {
      type: String,
      required: [true, "District is required"],
      trim: true,
    },
    modalPrice: {
      type: Number,
      default: null,
    },
    minPrice: {
      type: Number,
      default: null,
    },
    maxPrice: {
      type: Number,
      default: null,
    },
    market: {
      type: String,
      default: "Local Mandi",
      trim: true,
    },
    arrivalDate: {
      type: String,
      default: "",
    },
    recordsCount: {
      type: Number,
      default: 0,
    },
    rawRecords: {
      type: Array,
      default: [],
    },
    searchCount: {
      type: Number,
      default: 1,
    },
    lastSearchedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate entries for same user + crop + district by updating lastSearchedAt
SearchedCropSchema.index({ krishiId: 1, crop: 1, district: 1 });

const SearchedCrop =
  mongoose.models.SearchedCrop || mongoose.model("SearchedCrop", SearchedCropSchema);

export default SearchedCrop;
