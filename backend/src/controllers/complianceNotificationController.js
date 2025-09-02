const {
  getComplianceNotifications,
  getUnreadComplianceCount,
  markComplianceAsRead,
  getComplianceNotificationSummary,
  checkExpiringComplianceDocuments,
} = require("../services/complianceNotificationService");

// Get compliance notifications for current user
const getUserComplianceNotifications = async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      page = 1,
      limit = 50,
      status = "active",
      type,
      priority,
    } = req.query;

    const result = await getComplianceNotifications(userId, {
      page: parseInt(page),
      limit: parseInt(limit),
      status,
      type,
      priority,
    });

    if (result.success) {
      res.status(200).json({
        success: true,
        data: result.notifications,
        pagination: result.pagination,
      });
    } else {
      res.status(500).json({
        success: false,
        message: "Error fetching compliance notifications",
        error: result.error,
      });
    }
  } catch (error) {
    console.error("Error in getUserComplianceNotifications:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Get unread compliance notification count
const getUnreadComplianceNotificationCount = async (req, res) => {
  try {
    console.log('\n📊 === CHECKING COMPLIANCE NOTIFICATION COUNT ===');
    const userId = req.user._id;
    console.log('👤 User ID:', userId);
    console.log('👤 User Name:', req.user.name);
    
    const result = await getUnreadComplianceCount(userId);
    console.log('📬 Unread count result:', result);

    if (result.success) {
      console.log(`✅ Found ${result.count} unread compliance notifications`);
      res.status(200).json({
        success: true,
        count: result.count,
      });
    } else {
      console.log('❌ Error fetching count');
      res.status(500).json({
        success: false,
        message: "Error fetching unread count",
        count: 0,
      });
    }
  } catch (error) {
    console.error("❌ Error in getUnreadComplianceNotificationCount:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      count: 0,
    });
  }
};

// Mark compliance notification as read
const markComplianceNotificationAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user._id;

    const result = await markComplianceAsRead(notificationId, userId);

    if (result.success) {
      res.status(200).json({
        success: true,
        message: "Notification marked as read",
      });
    } else {
      res.status(500).json({
        success: false,
        message: result.message || "Error marking notification as read",
      });
    }
  } catch (error) {
    console.error("Error in markComplianceNotificationAsRead:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Get compliance notification dashboard summary
const getComplianceNotificationDashboard = async (req, res) => {
  try {
    const userId = req.user._id;
    const result = await getComplianceNotificationSummary(userId);

    if (result.success) {
      res.status(200).json({
        success: true,
        data: result.summary,
      });
    } else {
      res.status(500).json({
        success: false,
        message: "Error fetching dashboard summary",
        error: result.error,
      });
    }
  } catch (error) {
    console.error("Error in getComplianceNotificationDashboard:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Manual trigger for checking expiring documents (admin only)
const triggerDocumentExpiryCheck = async (req, res) => {
  try {
    console.log("🔄 Manual document expiry check triggered");
    const result = await checkExpiringComplianceDocuments();

    if (result.success) {
      res.status(200).json({
        success: true,
        message: "Document expiry check completed",
        data: {
          expired: result.expired,
          expiringSoon: result.expiringSoon,
          total: result.total,
        },
      });
    } else {
      res.status(500).json({
        success: false,
        message: "Error checking expiring documents",
        error: result.error,
      });
    }
  } catch (error) {
    console.error("Error in triggerDocumentExpiryCheck:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

module.exports = {
  getUserComplianceNotifications,
  getUnreadComplianceNotificationCount,
  markComplianceNotificationAsRead,
  getComplianceNotificationDashboard,
  triggerDocumentExpiryCheck,
};