// models/notificationModel.js (Fixed - removed static time field)
const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    // REMOVED: time field - now calculated dynamically
    type: {
      type: String,
      enum: ["job", "role", "user", "system", "security"],
      required: true,
    },
    // Added subType for more specific categorization
    subType: {
      type: String,
      enum: [
        "assignment",
        "kyc",
        "bra",
        "approval",
        "rejection",
        "cancellation",
      ],
      required: false,
    },
    status: {
      type: String,
      enum: ["read", "unread"],
      default: "unread",
    },
    relatedTo: {
      model: { type: String },
      id: { type: mongoose.Schema.Types.ObjectId },
    },
    recipients: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        read: { type: Boolean, default: false },
      },
    ],
    iconType: { type: String },
    iconColor: { type: String, default: "text-blue-600" },
    bgColor: { type: String, default: "bg-blue-50" },
  },
  {
    timestamps: true, // This provides createdAt and updatedAt automatically
  }
);

// Add index for better query performance
notificationSchema.index({ "recipients.user": 1, createdAt: -1 });

module.exports = mongoose.model("Notification", notificationSchema);
