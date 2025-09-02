const ComplianceNotification = require("../models/complianceNotificationModel");
const User = require("../models/userModel");
const ComplianceStaff = require("../models/complianceStaffModel");

// Create compliance notification
const createComplianceNotification = async (notificationData) => {
  try {
    const notification = new ComplianceNotification(notificationData);
    await notification.save();
    console.log(`✅ Compliance notification created: ${notification.title}`);
    return { success: true, notification };
  } catch (error) {
    console.error("❌ Error creating compliance notification:", error);
    return { success: false, error: error.message };
  }
};

// Get compliance notifications for specific users
const getComplianceNotifications = async (userId, options = {}) => {
  try {
    const {
      page = 1,
      limit = 50,
      status = "active",
      type = null,
      priority = null,
    } = options;

    const query = {
      targetUsers: userId,
      status: status,
    };

    if (type) query.type = type;
    if (priority) query.priority = priority;

    const notifications = await ComplianceNotification.find(query)
      .populate("targetUsers", "name email")
      .populate("metadata.staffId", "name email")
      .sort({ priority: -1, createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await ComplianceNotification.countDocuments(query);

    return {
      success: true,
      notifications,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
      },
    };
  } catch (error) {
    console.error("Error fetching compliance notifications:", error);
    return { success: false, error: error.message };
  }
};

// Get unread compliance notification count
const getUnreadComplianceCount = async (userId) => {
  try {
    const count = await ComplianceNotification.countDocuments({
      targetUsers: userId,
      status: "active",
      readBy: { $not: { $elemMatch: { userId: userId } } },
    });

    return { success: true, count };
  } catch (error) {
    console.error("Error fetching unread compliance count:", error);
    return { success: false, count: 0 };
  }
};

// Mark compliance notification as read
const markComplianceAsRead = async (notificationId, userId) => {
  try {
    const notification = await ComplianceNotification.findById(notificationId);
    
    if (!notification) {
      return { success: false, message: "Notification not found" };
    }

    // Check if already read by this user
    const alreadyRead = notification.readBy.some(
      (read) => read.userId.toString() === userId.toString()
    );

    if (!alreadyRead) {
      notification.readBy.push({
        userId: userId,
        readAt: new Date(),
      });
      await notification.save();
    }

    return { success: true };
  } catch (error) {
    console.error("Error marking compliance notification as read:", error);
    return { success: false, error: error.message };
  }
};

// Check for expiring documents and create compliance notifications
const checkExpiringComplianceDocuments = async () => {
  try {
    const now = new Date();
    const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    
    console.log("🔍 Checking for expiring compliance documents...");
    
    // Find all compliance staff with documents
    const staffMembers = await ComplianceStaff.find({
      'sections.documents': { $exists: true, $not: { $size: 0 } }
    });
    
    console.log(`📊 Found ${staffMembers.length} staff members to check`);
    
    // Get admin and compliance management users
    const targetUsers = await User.find({
      $or: [
        { "role.name": "admin" },
        { "role.name": "Compliance Management" }
      ]
    }).populate("role", "name");
    
    const targetUserIds = targetUsers.map(user => user._id);
    console.log(`🎯 Target users: ${targetUserIds.length}`);

    let expiredCount = 0;
    let expiringSoonCount = 0;
    
    for (const staff of staffMembers) {
      for (const section of staff.sections) {
        for (const document of section.documents) {
          if (document.expireDate) {
            const expireDate = new Date(document.expireDate);
            const daysUntilExpiry = Math.ceil((expireDate - now) / (1000 * 60 * 60 * 24));
            
            // Document has expired
            if (expireDate < now) {
              await createComplianceNotification({
                title: "📋 Compliance Document Expired",
                message: `Document "${document.name}" from ${section.title} section for ${staff.name} has EXPIRED on ${expireDate.toLocaleDateString()}`,
                type: "document_expired",
                priority: "critical",
                targetUsers: targetUserIds,
                metadata: {
                  staffId: staff._id,
                  documentId: document.id,
                  sectionId: section._id,
                  expireDate: document.expireDate,
                  daysLeft: daysUntilExpiry,
                  staffName: staff.name,
                  documentName: document.name,
                  sectionName: section.title,
                },
                actionRequired: true,
              });
              expiredCount++;
            }
            // Document expires in 30 days or less
            else if (expireDate <= thirtyDaysFromNow) {
              const priority = daysUntilExpiry <= 7 ? "high" : "medium";
              
              await createComplianceNotification({
                title: "⏰ Compliance Document Expiring Soon",
                message: `Document "${document.name}" from ${section.title} section for ${staff.name} will expire in ${daysUntilExpiry} days (${expireDate.toLocaleDateString()})`,
                type: "document_expiring_soon",
                priority: priority,
                targetUsers: targetUserIds,
                metadata: {
                  staffId: staff._id,
                  documentId: document.id,
                  sectionId: section._id,
                  expireDate: document.expireDate,
                  daysLeft: daysUntilExpiry,
                  staffName: staff.name,
                  documentName: document.name,
                  sectionName: section.title,
                },
                actionRequired: daysUntilExpiry <= 7,
              });
              expiringSoonCount++;
            }
          }
        }
      }
    }
    
    console.log(`✅ Compliance document check completed:`);
    console.log(`   📊 Expired documents: ${expiredCount}`);
    console.log(`   ⏰ Expiring soon: ${expiringSoonCount}`);
    
    return {
      success: true,
      expired: expiredCount,
      expiringSoon: expiringSoonCount,
      total: expiredCount + expiringSoonCount,
    };
  } catch (error) {
    console.error("❌ Error checking expiring compliance documents:", error);
    return { success: false, error: error.message };
  }
};

// Get compliance notification summary/dashboard stats
const getComplianceNotificationSummary = async (userId) => {
  try {
    const totalActive = await ComplianceNotification.countDocuments({
      targetUsers: userId,
      status: "active",
    });

    const unreadCount = await ComplianceNotification.countDocuments({
      targetUsers: userId,
      status: "active",
      readBy: { $not: { $elemMatch: { userId: userId } } },
    });

    const criticalCount = await ComplianceNotification.countDocuments({
      targetUsers: userId,
      status: "active",
      priority: "critical",
    });

    const highPriorityCount = await ComplianceNotification.countDocuments({
      targetUsers: userId,
      status: "active",
      priority: "high",
    });

    const expiredDocsCount = await ComplianceNotification.countDocuments({
      targetUsers: userId,
      status: "active",
      type: "document_expired",
    });

    const expiringSoonCount = await ComplianceNotification.countDocuments({
      targetUsers: userId,
      status: "active",
      type: "document_expiring_soon",
    });

    return {
      success: true,
      summary: {
        totalActive,
        unreadCount,
        criticalCount,
        highPriorityCount,
        expiredDocsCount,
        expiringSoonCount,
      },
    };
  } catch (error) {
    console.error("Error fetching compliance notification summary:", error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  createComplianceNotification,
  getComplianceNotifications,
  getUnreadComplianceCount,
  markComplianceAsRead,
  checkExpiringComplianceDocuments,
  getComplianceNotificationSummary,
};