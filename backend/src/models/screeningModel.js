const mongoose = require("mongoose");

const screeningSchema = new mongoose.Schema(
  {
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: true,
    },
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true,
    },
    screeningType: {
      type: String,
      enum: [
        "AML/KYC Screening",
        "PEP Check", 
        "Sanctions Screening",
        "Adverse Media Check",
        "Criminal Records Check",
        "Financial Crime Check",
        "Enhanced Due Diligence"
      ],
      required: true,
    },
    result: {
      type: String,
      enum: ["clear", "review", "alert", "pending"],
      required: true,
    },
    details: {
      type: String,
      required: true,
    },
    screenedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    dataSources: [{
      name: { type: String, required: true },
      type: { type: String, enum: ["database", "api", "manual"], required: true },
      url: String,
      lastChecked: { type: Date, default: Date.now },
    }],
    riskScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    findings: [{
      type: { type: String, required: true },
      description: { type: String, required: true },
      severity: {
        type: String,
        enum: ["low", "medium", "high", "critical"],
        default: "low",
      },
      resolved: {
        type: Boolean,
        default: false,
      },
      resolvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      resolvedAt: Date,
      notes: String,
    }],
    documents: [{
      id: {
        type: String,
        required: true
      },
      name: {
        type: String,
        required: true
      },
      description: {
        type: String,
        required: true
      },
      uploadDate: {
        type: Date,
        default: Date.now
      },
      size: {
        type: String,
        required: true
      },
      uploadedBy: {
        type: String,
        required: true
      },
      fileUrl: {
        type: String
      },
      expireDate: {
        type: Date
      },
      cloudinaryId: {
        type: String
      }
    }],
    reviewNotes: String,
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    reviewedAt: Date,
    nextReviewDate: Date,
    status: {
      type: String,
      enum: ["active", "expired", "archived"],
      default: "active",
    },
  },
  { timestamps: true }
);

// Index for efficient queries
screeningSchema.index({ clientId: 1, createdAt: -1 });
screeningSchema.index({ jobId: 1 });
screeningSchema.index({ screeningType: 1, result: 1 });

module.exports = mongoose.model("Screening", screeningSchema);