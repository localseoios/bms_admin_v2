// routes/notificationRoutes.js
const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  getUserNotifications,
  markNotificationsAsRead,
  getUnreadCount,
} = require("../controllers/notificationController");

// Get all notifications for the current user
router.get("/", protect, getUserNotifications);

// Get unread notification count
router.get("/unread-count", protect, getUnreadCount);

// Mark notifications as read
router.put("/mark-read", protect, markNotificationsAsRead);

module.exports = router;
