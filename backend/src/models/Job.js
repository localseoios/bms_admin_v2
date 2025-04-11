const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema(
  {
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: true,
    },
    serviceType: { type: String, required: true },
    documentPassport: { type: String, required: true },
    documentID: { type: String, required: true },
    otherDocuments: [{ type: String }],
    assignedPerson: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    jobDetails: { type: String, required: true },
    specialDescription: { type: String },
    clientName: { type: String, required: true }, // Kept for denormalization
    gmail: { type: String, required: true }, // Kept for compatibility
    startingPoint: { type: String, required: true }, // Kept for compatibility
    status: {
      type: String,
      enum: [
        "pending",
        "approved",
        "rejected",
        "corrected",
        "cancelled",
        "om_completed",
        // KYC statuses
        "kyc_pending",
        "kyc_lmro_approved",
        "kyc_dlmro_approved",
        "kyc_rejected",
        "completed",
        // BRA statuses
        "bra_pending",
        "bra_lmro_approved",
        "bra_dlmro_approved",
        "bra_rejected",
        "fully_completed_bra",
      ],
      default: "pending",
    },
    rejectionReason: {
      type: String,
      required: function () {
        return this.status === "rejected";
      },
    },
    cancellationReason: {
      type: String,
      required: function () {
        return this.status === "cancelled";
      },
    },
    rejectionDocument: { type: String },
    resubmissions: [
      {
        resubmitNotes: { type: String },
        newDocumentPassport: { type: String },
        newDocumentID: { type: String },
        newOtherDocuments: [{ type: String }],
        resubmittedAt: { type: Date, default: Date.now },
      },
    ],
    // Timeline array to track job progress
    timeline: [
      {
        status: { type: String, required: true },
        description: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
        updatedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Job", jobSchema);
