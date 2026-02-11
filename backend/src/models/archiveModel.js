const mongoose = require("mongoose");

const archiveSchema = new mongoose.Schema(
  {
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: true,
      index: true,
    },
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      index: true,
    },
    documentType: {
      type: String,
      required: true,
      enum: [
        "passport",
        "qid",
        "id_document",
        "cr_extract",
        "company_memo",
        "engagement_letter",
        "other_document",
        "kyc_document",
        "bra_document",
        "ubo_document",
        "cdd_document",
        "approval_document",
        "rejection_document",
        "resubmission_document",
      ],
      index: true,
    },
    sourceType: {
      type: String,
      required: true,
      enum: [
        "job",
        "company",
        "engagement_letter",
        "director",
        "shareholder",
        "secretary",
        "sef",
        "kyc",
        "bra",
        "ubo",
        "cdd",
      ],
    },
    personName: {
      type: String,
    },
    personId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    fileUrl: {
      type: String,
      required: true,
    },
    fileName: {
      type: String,
    },
    title: {
      type: String,
    },
    description: {
      type: String,
    },
    archivedAt: {
      type: Date,
      default: Date.now,
    },
    archivedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    reason: {
      type: String,
      enum: ["replaced", "updated", "manual"],
      default: "replaced",
    },
    originalUploadedAt: {
      type: Date,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
    },
  },
  { timestamps: true }
);

archiveSchema.index({ clientId: 1, archivedAt: -1 });
archiveSchema.index({ documentType: 1, archivedAt: -1 });
archiveSchema.index({ sourceType: 1, archivedAt: -1 });

module.exports = mongoose.model("Archive", archiveSchema);
