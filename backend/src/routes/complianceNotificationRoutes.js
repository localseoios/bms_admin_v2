const express = require("express");
const router = express.Router();
const {
  getUserComplianceNotifications,
  getUnreadComplianceNotificationCount,
  markComplianceNotificationAsRead,
  getComplianceNotificationDashboard,
  triggerDocumentExpiryCheck,
} = require("../controllers/complianceNotificationController");
const { protect } = require("../middleware/authMiddleware");

// Apply authentication middleware to all routes
router.use(protect);

// Get compliance notifications for current user
router.get("/", getUserComplianceNotifications);

// Get unread compliance notification count
router.get("/unread-count", getUnreadComplianceNotificationCount);

// Get compliance notification dashboard/summary
router.get("/dashboard", getComplianceNotificationDashboard);

// Mark specific notification as read
router.put("/:notificationId/read", markComplianceNotificationAsRead);

// Manual trigger for document expiry check (admin only)
router.post("/check-expiring", triggerDocumentExpiryCheck);

module.exports = router;