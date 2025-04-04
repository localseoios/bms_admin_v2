// models/braApprovalModel.js
const mongoose = require("mongoose");

// Reuse the document schema from KYC model
const documentSchema = new mongoose.Schema({
  fileUrl: { type: String, required: true }, // Cloudinary secure URL
  fileName: { type: String, required: true }, // Original filename
  fileType: { type: String }, // MIME type
  cloudinaryId: { type: String, required: true }, // Public ID in Cloudinary
  uploadedAt: { type: Date, default: Date.now },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
});

const approvalSchema = new mongoose.Schema({
  approved: { type: Boolean, default: false },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  approvedAt: { type: Date },
  notes: { type: String },
  document: {
    type: documentSchema,
    required: false, // Not requiring at schema level, enforced in controller
  },
});

const braApprovalSchema = new mongoose.Schema(
  {
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true,
      unique: true,
    },
    status: {
      type: String,
      enum: ["pending", "in_progress", "completed", "rejected"],
      default: "pending",
    },
    currentApprovalStage: {
      type: String,
      enum: ["lmro", "dlmro", "ceo", "completed", "rejected"],
      default: "lmro",
    },
    lmroApproval: {
      type: approvalSchema,
      default: () => ({}),
    },
    dlmroApproval: {
      type: approvalSchema,
      default: () => ({}),
    },
    ceoApproval: {
      type: approvalSchema,
      default: () => ({}),
    },
    rejectionReason: { type: String },
    rejectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    rejectedAt: { type: Date },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model("BraApproval", braApprovalSchema);
