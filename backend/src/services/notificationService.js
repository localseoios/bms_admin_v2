// services/notificationService.js (Fixed time display issue)
const Notification = require("../models/notificationModel");
const User = require("../models/userModel");
const mongoose = require("mongoose");

// Updated to include BRA notification style
const getNotificationStyle = (type, subType = null) => {
  if (subType === "deletion") {
    return {
      iconType: "TrashIcon",
      iconColor: "text-red-600",
      bgColor: "bg-red-50",
    };
  }

  switch (type) {
    case "job":
      if (subType === "assignment") {
        return {
          iconType: "CheckCircleIcon",
          iconColor: "text-green-600",
          bgColor: "bg-green-50",
        };
      }
      if (subType === "removal") {
        return {
          iconType: "XCircleIcon",
          iconColor: "text-red-600",
          bgColor: "bg-red-50",
        };
      }
      if (subType === "kyc") {
        return {
          iconType: "ShieldCheckIcon",
          iconColor: "text-purple-600",
          bgColor: "bg-purple-50",
        };
      }
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
    case "client":
      if (subType === "document_submission") {
        return {
          iconType: "DocumentArrowUpIcon",
          iconColor: "text-emerald-600",
          bgColor: "bg-emerald-50",
        };
      }
      return {
        iconType: "UserGroupIcon",
        iconColor: "text-indigo-600",
        bgColor: "bg-indigo-50",
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
    case "expiry_alert":
      if (subType === "expired") {
        return {
          iconType: "XCircleIcon",
          iconColor: "text-red-600",
          bgColor: "bg-red-50",
        };
      }
      if (subType === "critical") {
        return {
          iconType: "ExclamationTriangleIcon",
          iconColor: "text-red-600",
          bgColor: "bg-red-50",
        };
      }
      if (subType === "warning") {
        return {
          iconType: "ClockIcon",
          iconColor: "text-orange-600",
          bgColor: "bg-orange-50",
        };
      }
      return {
        iconType: "ExclamationCircleIcon",
        iconColor: "text-yellow-600",
        bgColor: "bg-yellow-50",
      };
    default:
      return {
        iconType: "InformationCircleIcon",
        iconColor: "text-blue-600",
        bgColor: "bg-blue-50",
      };
  }
};

// Format the time for display - FIXED to accept a date parameter
const formatTimeAgo = (date) => {
  const now = new Date();
  const notificationDate = new Date(date);
  const seconds = Math.floor((now - notificationDate) / 1000);

  let interval = seconds / 31536000;
  if (interval > 1)
    return (
      Math.floor(interval) +
      " year" +
      (Math.floor(interval) > 1 ? "s" : "") +
      " ago"
    );

  interval = seconds / 2592000;
  if (interval > 1)
    return (
      Math.floor(interval) +
      " month" +
      (Math.floor(interval) > 1 ? "s" : "") +
      " ago"
    );

  interval = seconds / 86400;
  if (interval > 1)
    return (
      Math.floor(interval) +
      " day" +
      (Math.floor(interval) > 1 ? "s" : "") +
      " ago"
    );

  interval = seconds / 3600;
  if (interval > 1)
    return (
      Math.floor(interval) +
      " hour" +
      (Math.floor(interval) > 1 ? "s" : "") +
      " ago"
    );

  interval = seconds / 60;
  if (interval > 1)
    return (
      Math.floor(interval) +
      " minute" +
      (Math.floor(interval) > 1 ? "s" : "") +
      " ago"
    );

  if (seconds < 30) return "just now";
  return (
    Math.floor(seconds) +
    " second" +
    (Math.floor(seconds) > 1 ? "s" : "") +
    " ago"
  );
};

// Create a new notification - FIXED: Remove static time calculation
const createNotification = async (notificationData, queryOrUserId) => {
  try {
    const styling = getNotificationStyle(
      notificationData.type,
      notificationData.subType
    );

    const notification = new Notification({
      ...notificationData,
      ...styling,
      recipients: [],
    });

    let users = [];

    if (typeof queryOrUserId === "string") {
      users = await User.find({ _id: queryOrUserId });
    } else if (Array.isArray(queryOrUserId)) {
      const validIds = queryOrUserId.filter(id => id != null);
      if (validIds.length > 0) {
        users = await User.find({ _id: { $in: validIds } });
      }
    } else if (queryOrUserId && typeof queryOrUserId === "object") {
      const queryKeys = Object.keys(queryOrUserId);
      const hasRolePermissionQuery = queryKeys.some(key => key.startsWith("role.permissions."));

      if (hasRolePermissionQuery) {
        const allUsers = await User.find({}).populate({
          path: "role",
          select: "name permissions",
        });

        users = allUsers.filter((user) => {
          if (!user.role || !user.role.permissions) return false;

          for (const key of queryKeys) {
            if (key.startsWith("role.permissions.")) {
              const permPath = key.replace("role.permissions.", "");
              const parts = permPath.split(".");
              let value = user.role.permissions;

              for (const part of parts) {
                if (value && typeof value === "object") {
                  value = value[part];
                } else {
                  value = undefined;
                  break;
                }
              }

              if (value !== queryOrUserId[key]) return false;
            }
          }
          return true;
        });
      } else {
        users = await User.find(queryOrUserId).populate("role");
      }
    }

    notification.recipients = users.map((user) => ({
      user: user._id,
      read: false,
    }));

    if (notification.recipients.length > 0) {
      await notification.save();
      console.log(`Notification created with ${notification.recipients.length} recipients`);
    } else {
      console.log("No recipients found for notification query:", queryOrUserId);
    }

    return notification;
  } catch (error) {
    console.error("Error creating notification:", error);
    throw error;
  }
};

const getJobRecipients = (job, actionUserId = null) => {
  const recipients = new Set();

  if (job.createdBy) {
    const id = job.createdBy._id || job.createdBy;
    recipients.add(id.toString());
  }

  if (job.assignedPerson) {
    const id = job.assignedPerson._id || job.assignedPerson;
    recipients.add(id.toString());
  }

  if (job.selectedServiceUser) {
    const id = job.selectedServiceUser._id || job.selectedServiceUser;
    recipients.add(id.toString());
  }

  if (job.selectedServiceUsers && job.selectedServiceUsers.length > 0) {
    job.selectedServiceUsers.forEach(user => {
      const id = user._id || user;
      recipients.add(id.toString());
    });
  }

  if (actionUserId) {
    const id = actionUserId._id || actionUserId;
    recipients.add(id.toString());
  }

  return Array.from(recipients);
};

const Job = require("../models/Job");

const createJobNotification = async (notificationData, job, actionUserId = null) => {
  try {
    let fullJob = job;

    if (job._id && (!job.selectedServiceUsers || job.selectedServiceUsers.length === 0)) {
      const fetchedJob = await Job.findById(job._id)
        .select("createdBy assignedPerson selectedServiceUser selectedServiceUsers")
        .lean();

      if (fetchedJob) {
        fullJob = {
          ...job,
          createdBy: job.createdBy || fetchedJob.createdBy,
          assignedPerson: job.assignedPerson || fetchedJob.assignedPerson,
          selectedServiceUser: job.selectedServiceUser || fetchedJob.selectedServiceUser,
          selectedServiceUsers: fetchedJob.selectedServiceUsers || [],
        };
      }
    }

    const recipients = getJobRecipients(fullJob, actionUserId);
    console.log(`Job notification recipients for job ${job._id}:`, recipients);
    return createNotification(notificationData, recipients);
  } catch (error) {
    console.error("Error in createJobNotification:", error);
    const recipients = getJobRecipients(job, actionUserId);
    return createNotification(notificationData, recipients);
  }
};

// Get notifications for a user - FIXED: Calculate time dynamically
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
          createdAt: 1,
          relatedTo: 1,
          status: { $cond: ["$userSpecificStatus.read", "read", "unread"] },
        },
      },
      { $sort: { createdAt: -1 } },
    ]);

    // FIXED: Calculate time dynamically for each notification
    const notificationsWithTime = notifications.map((notification) => ({
      ...notification,
      time: formatTimeAgo(notification.createdAt),
    }));

    return notificationsWithTime;
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

const clearAllNotifications = async (userId) => {
  try {
    const userObjectId = new mongoose.Types.ObjectId(userId);

    await Notification.updateMany(
      { "recipients.user": userObjectId },
      { $pull: { recipients: { user: userObjectId } } }
    );

    await Notification.deleteMany({ recipients: { $size: 0 } });

    return { success: true };
  } catch (error) {
    console.error("Error clearing notifications:", error);
    throw error;
  }
};

const removeNotification = async (notificationId, userId) => {
  try {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const notificationObjectId = new mongoose.Types.ObjectId(notificationId);

    await Notification.updateOne(
      { _id: notificationObjectId },
      { $pull: { recipients: { user: userObjectId } } }
    );

    const notification = await Notification.findById(notificationObjectId);
    if (notification && notification.recipients.length === 0) {
      await Notification.deleteOne({ _id: notificationObjectId });
    }

    return { success: true };
  } catch (error) {
    console.error("Error removing notification:", error);
    throw error;
  }
};

module.exports = {
  createNotification,
  createJobNotification,
  getJobRecipients,
  getUserNotifications,
  markAsRead,
  getNotificationStyle,
  formatTimeAgo,
  clearAllNotifications,
  removeNotification,
};
