// controllers/notificationController.js
const notificationService = require("../services/notificationService");
const asyncHandler = require("express-async-handler");

// Get all notifications for the current user
const getUserNotifications = asyncHandler(async (req, res) => {
  try {
    const notifications = await notificationService.getUserNotifications(
      req.user._id
    );
    res.status(200).json(notifications);
  } catch (error) {
    res.status(500).json({
      message: "Error retrieving notifications",
      error: error.message,
    });
  }
});

// Mark notifications as read
const markNotificationsAsRead = asyncHandler(async (req, res) => {
  try {
    const { notificationIds } = req.body;
    const result = await notificationService.markAsRead(
      req.user._id,
      notificationIds || []
    );
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({
      message: "Error marking notifications as read",
      error: error.message,
    });
  }
});

// Get unread notification count
const getUnreadCount = asyncHandler(async (req, res) => {
  try {
    const notifications = await notificationService.getUserNotifications(
      req.user._id
    );
    const unreadCount = notifications.filter(
      (notification) => notification.status === "unread"
    ).length;
    res.status(200).json({ unreadCount });
  } catch (error) {
    res.status(500).json({
      message: "Error retrieving unread count",
      error: error.message,
    });
  }
});

module.exports = {
  getUserNotifications,
  markNotificationsAsRead,
  getUnreadCount,
};
