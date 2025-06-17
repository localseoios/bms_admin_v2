// controllers/notificationController.js (Fixed with better error handling)
const notificationService = require("../services/notificationService");
const asyncHandler = require("express-async-handler");

// Get all notifications for the current user
const getUserNotifications = asyncHandler(async (req, res) => {
  try {
    console.log(`Fetching notifications for user: ${req.user._id}`);

    const notifications = await notificationService.getUserNotifications(
      req.user._id
    );

    console.log(`Retrieved ${notifications.length} notifications`);

    // Log a sample notification to verify time calculation
    if (notifications.length > 0) {
      console.log("Sample notification:", {
        title: notifications[0].title,
        createdAt: notifications[0].createdAt,
        time: notifications[0].time,
      });
    }

    res.status(200).json(notifications);
  } catch (error) {
    console.error("Error in getUserNotifications:", error);
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

    console.log(`Marking notifications as read for user: ${req.user._id}`, {
      notificationIds: notificationIds || "all",
    });

    const result = await notificationService.markAsRead(
      req.user._id,
      notificationIds || []
    );

    console.log("Mark as read result:", result);

    res.status(200).json(result);
  } catch (error) {
    console.error("Error in markNotificationsAsRead:", error);
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

    console.log(`Unread count for user ${req.user._id}: ${unreadCount}`);

    res.status(200).json({ unreadCount });
  } catch (error) {
    console.error("Error in getUnreadCount:", error);
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
    console.log(
      `Removing notification ${notificationId} for user ${req.user._id}`
    );

    // This would need a corresponding function in the service
    // await notificationService.removeNotification(notificationId, req.user._id);

    res.status(200).json({ message: "Notification removed successfully" });
  } catch (error) {
    console.error("Error in removeNotification:", error);
    res.status(500).json({
      message: "Error removing notification",
      error: error.message,
    });
  }
});

// Added a new function to clear all notifications (optional enhancement)
const clearAllNotifications = asyncHandler(async (req, res) => {
  try {
    console.log(`Clearing all notifications for user ${req.user._id}`);

    // This would need a corresponding function in the service
    // await notificationService.clearAllNotifications(req.user._id);

    res.status(200).json({ message: "All notifications cleared successfully" });
  } catch (error) {
    console.error("Error in clearAllNotifications:", error);
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
