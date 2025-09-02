const mongoose = require("mongoose");

const complianceNotificationSchema = mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["document_expired", "document_expiring_soon", "document_uploaded", "document_update", "staff_added"],
      required: true,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
    },
    targetUsers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    }],
    readBy: [{
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      readAt: {
        type: Date,
        default: Date.now,
      },
    }],
    metadata: {
      staffId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ComplianceStaff",
      },
      documentId: String,
      sectionId: String,
      expireDate: Date,
      daysLeft: Number,
      staffName: String,
      documentName: String,
      sectionName: String,
      updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      updaterName: String,
      originalExpireDate: Date,
      newExpireDate: Date,
    },
    status: {
      type: String,
      enum: ["active", "resolved", "dismissed"],
      default: "active",
    },
    actionRequired: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
complianceNotificationSchema.index({ targetUsers: 1, status: 1, createdAt: -1 });
complianceNotificationSchema.index({ type: 1, priority: 1 });
complianceNotificationSchema.index({ "metadata.expireDate": 1 });

module.exports = mongoose.model("ComplianceNotification", complianceNotificationSchema);