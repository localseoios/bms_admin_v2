// routes/braRoutes.js
const express = require("express");
const router = express.Router();
const {
  protect,
  checkPermission,
  checkBraPermission,
} = require("../middleware/authMiddleware");
const {
  initializeBra,
  getBraStatus,
  lmroApprove,
  dlmroApprove,
  ceoApprove,
  rejectBra,
  getAllBraJobs,
} = require("../controllers/braController");
const { upload, largeFileUpload } = require("../services/fileUploadService");

// Initialize BRA process (can be called by Operation Management users or automatically after KYC completes)
router.post(
  "/jobs/:jobId/initialize",
  protect,
  checkPermission("operationManagement"),
  initializeBra
);

// Get BRA status - accessible to any authenticated user with BRA role
router.get("/jobs/:jobId/status", protect, checkBraPermission, getBraStatus);

// Get all BRA jobs for management page
router.get("/jobs", protect, checkBraPermission, getAllBraJobs);

// LMRO Approval with document upload requirement
router.put(
  "/jobs/:jobId/lmro-approve",
  protect,
  checkPermission("braManagement.lmro"),
  upload.single("document"),
  lmroApprove
);

// DLMRO Approval with document upload requirement
router.put(
  "/jobs/:jobId/dlmro-approve",
  protect,
  checkPermission("braManagement.dlmro"),
  upload.single("document"),
  dlmroApprove
);

// CEO Approval with document upload requirement
// In braRoutes.js, update the CEO approval route:
router.put(
  "/jobs/:jobId/ceo-approve",
  protect,
  checkPermission("braManagement.ceo"),
  largeFileUpload.single("document"), // Use largeFileUpload instead of upload
  ceoApprove
);

// Reject BRA (each role can only reject at their stage)
router.put("/jobs/:jobId/reject", protect, checkBraPermission, rejectBra);

module.exports = router;
