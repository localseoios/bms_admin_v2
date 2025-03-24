// models/notificationModel.js
const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    time: { type: String }, // For display purposes
    type: {
      type: String,
      enum: ["job", "role", "user", "system", "security"],
      required: true,
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
  { timestamps: true }
);

module.exports = mongoose.model("Notification", notificationSchema);
