const mongoose = require("mongoose");

const monitoringDocumentSchema = new mongoose.Schema(
  {
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: true,
    },
    documentId: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    fileUrl: {
      type: String,
      required: true,
    },
    cloudinaryId: {
      type: String,
    },
    size: {
      type: String,
      required: true,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    uploadedByName: {
      type: String,
      required: true,
    },
    fileType: {
      type: String,
    },
    status: {
      type: String,
      enum: ["active", "archived"],
      default: "active",
    },
  },
  { timestamps: true }
);

// Index for efficient queries (documentId already indexed via unique: true)
monitoringDocumentSchema.index({ clientId: 1, createdAt: -1 });

module.exports = mongoose.model("MonitoringDocument", monitoringDocumentSchema);