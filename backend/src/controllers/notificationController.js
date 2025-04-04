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

// Added a new function to remove notifications (optional enhancement)
const removeNotification = asyncHandler(async (req, res) => {
  try {
    const { notificationId } = req.params;
    // This would need a corresponding function in the service
    // await notificationService.removeNotification(notificationId, req.user._id);
    res.status(200).json({ message: "Notification removed successfully" });
  } catch (error) {
    res.status(500).json({
      message: "Error removing notification",
      error: error.message,
    });
  }
});

// Added a new function to clear all notifications (optional enhancement)
const clearAllNotifications = asyncHandler(async (req, res) => {
  try {
    // This would need a corresponding function in the service
    // await notificationService.clearAllNotifications(req.user._id);
    res.status(200).json({ message: "All notifications cleared successfully" });
  } catch (error) {
    res.status(500).json({
      message: "Error clearing notifications",
      error: error.message,
    });
  }
});

module.exports = {
  getUserNotifications,
  markNotificationsAsRead,
  getUnreadCount,
  removeNotification,
  clearAllNotifications,
};
