// routes/notificationRoutes.js
const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  getUserNotifications,
  markNotificationsAsRead,
  getUnreadCount,
  removeNotification,
  clearAllNotifications,
} = require("../controllers/notificationController");

// Get all notifications for the current user
router.get("/", protect, getUserNotifications);

// Mark notifications as read
router.put("/mark-read", protect, markNotificationsAsRead);

// Get unread notification count
router.get("/unread-count", protect, getUnreadCount);

// Remove a specific notification
router.delete("/:notificationId", protect, removeNotification);

// Clear all notifications
router.delete("/", protect, clearAllNotifications);

module.exports = router;
