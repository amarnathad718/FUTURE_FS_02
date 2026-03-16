const mongoose = require("mongoose");

const LeadSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, required: true, trim: true },
    source: {
      type: String,
      enum: ["Website", "Referral", "Social Media", "Other"],
      default: "Website"
    },
    status: {
      type: String,
      enum: ["New", "Contacted", "Converted"],
      default: "New"
    },
    priority: {
      type: String,
      enum: ["High", "Medium", "Low"],
      default: "Medium"
    },
    notes: { type: String, default: "" },
    followUpDate: { type: String, default: "" },
    followUp: { type: String, default: "" },
    createdAt: { type: String, required: true },
    updatedAt: { type: String, required: true }
  },
  { versionKey: false }
);

module.exports = mongoose.model("Lead", LeadSchema);
