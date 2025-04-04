// services/notificationService.js (Updated for BRA notifications)
const Notification = require("../models/notificationModel");
const User = require("../models/userModel");
const mongoose = require("mongoose");

// Updated to include BRA notification style
const getNotificationStyle = (type, subType = null) => {
  switch (type) {
    case "job":
      if (subType === "assignment") {
        return {
          iconType: "CheckCircleIcon",
          iconColor: "text-green-600",
          bgColor: "bg-green-50",
        };
      }
      if (subType === "kyc") {
        return {
          iconType: "ShieldCheckIcon",
          iconColor: "text-purple-600",
          bgColor: "bg-purple-50",
        };
      }
      // New BRA notification style
      if (subType === "bra") {
        return {
          iconType: "ClipboardCheckIcon",
          iconColor: "text-teal-600",
          bgColor: "bg-teal-50",
        };
      }
      return {
        iconType: "BriefcaseIcon",
        iconColor: "text-blue-600",
        bgColor: "bg-blue-50",
      };
    case "status":
      return {
        iconType: "ArrowPathIcon",
        iconColor: "text-purple-600",
        bgColor: "bg-purple-50",
      };
    case "role":
      return {
        iconType: "UserPlusIcon",
        iconColor: "text-green-600",
        bgColor: "bg-green-50",
      };
    case "user":
      return {
        iconType: "UserPlusIcon",
        iconColor: "text-blue-600",
        bgColor: "bg-blue-50",
      };
    case "security":
      return {
        iconType: "ShieldCheckIcon",
        iconColor: "text-red-600",
        bgColor: "bg-red-50",
      };
    case "system":
      return {
        iconType: "ExclamationCircleIcon",
        iconColor: "text-orange-600",
        bgColor: "bg-orange-50",
      };
    default:
      return {
        iconType: "InformationCircleIcon",
        iconColor: "text-blue-600",
        bgColor: "bg-blue-50",
      };
  }
};

// Format the time for display
const formatTimeAgo = (date) => {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);

  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + " years ago";

  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + " months ago";

  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + " days ago";

  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + " hours ago";

  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + " minutes ago";

  return "just now";
};

// Create a new notification
const createNotification = async (notificationData, queryOrUserId) => {
  try {
    // Format the time for display
    const now = new Date();
    const time = formatTimeAgo(now);

    // Get styling based on notification type
    const styling = getNotificationStyle(
      notificationData.type,
      notificationData.subType
    );

    // Create the notification with styling
    const notification = new Notification({
      ...notificationData,
      time,
      ...styling,
      recipients: [],
    });

    // Find users to notify
    let users = [];

    if (typeof queryOrUserId === "string") {
      // Single user ID provided
      users = await User.find({ _id: queryOrUserId });
    } else {
      // Query provided (e.g. { role.name: "admin" })
      users = await User.find(queryOrUserId);
    }

    // Add users to recipients array
    notification.recipients = users.map((user) => ({
      user: user._id,
      read: false,
    }));

    // Only save if we have recipients
    if (notification.recipients.length > 0) {
      await notification.save();
    }

    return notification;
  } catch (error) {
    console.error("Error creating notification:", error);
    throw error;
  }
};

// Get notifications for a user
const getUserNotifications = async (userId) => {
  try {
    // Convert string ID to ObjectId
    const userObjectId = new mongoose.Types.ObjectId(userId);

    const notifications = await Notification.aggregate([
      {
        $match: {
          "recipients.user": userObjectId,
        },
      },
      {
        $addFields: {
          userSpecificStatus: {
            $arrayElemAt: [
              {
                $filter: {
                  input: "$recipients",
                  as: "recipient",
                  cond: {
                    $eq: ["$$recipient.user", userObjectId],
                  },
                },
              },
              0,
            ],
          },
        },
      },
      {
        $project: {
          _id: 1,
          title: 1,
          description: 1,
          type: 1,
          subType: 1, // Include subType for filtering
          iconType: 1,
          iconColor: 1,
          bgColor: 1,
          time: 1,
          createdAt: 1,
          relatedTo: 1,
          status: { $cond: ["$userSpecificStatus.read", "read", "unread"] },
        },
      },
      { $sort: { createdAt: -1 } },
    ]);

    return notifications;
  } catch (error) {
    console.error("Error getting user notifications:", error);
    throw error;
  }
};

// Fixed markAsRead function to properly update array elements
const markAsRead = async (userId, notificationIds = []) => {
  try {
    // Convert string ID to ObjectId
    const userObjectId = new mongoose.Types.ObjectId(userId);

    if (notificationIds.length === 0) {
      // Mark all notifications as read - fixed update operation
      await Notification.updateMany(
        { "recipients.user": userObjectId },
        { $set: { "recipients.$[elem].read": true } },
        { arrayFilters: [{ "elem.user": userObjectId }] }
      );
    } else {
      // Mark specific notifications as read
      for (const notificationId of notificationIds) {
        const notificationObjectId = new mongoose.Types.ObjectId(
          notificationId
        );

        // Fixed update operation with arrayFilters
        await Notification.updateOne(
          { _id: notificationObjectId },
          { $set: { "recipients.$[elem].read": true } },
          { arrayFilters: [{ "elem.user": userObjectId }] }
        );
      }
    }
    return { success: true };
  } catch (error) {
    console.error("Error marking notifications as read:", error);
    throw error;
  }
};

module.exports = {
  createNotification,
  getUserNotifications,
  markAsRead,
  getNotificationStyle,
  formatTimeAgo,
};
