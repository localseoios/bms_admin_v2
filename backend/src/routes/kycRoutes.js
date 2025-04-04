// routes/kycRoutes.js
const express = require("express");
const router = express.Router();
const {
  protect,
  checkPermission,
  checkKycPermission,
} = require("../middleware/authMiddleware");
const {
  initializeKyc,
  getKycStatus,
  lmroApprove,
  dlmroApprove,
  ceoApprove,
  rejectKyc,
  getAllKycJobs,
} = require("../controllers/kycController");
const { upload } = require("../services/fileUploadService");

// Initialize KYC process (can be called by Operation Management users)
router.post(
  "/jobs/:jobId/initialize",
  protect,
  checkPermission("operationManagement"),
  initializeKyc
);

// Get KYC status - accessible to any authenticated user with KYC role
router.get("/jobs/:jobId/status", protect, checkKycPermission, getKycStatus);

// Get all KYC jobs for management page
router.get("/jobs", protect, checkKycPermission, getAllKycJobs);

// LMRO Approval with document upload requirement using Cloudinary
router.put(
  "/jobs/:jobId/lmro-approve",
  protect,
  checkPermission("kycManagement.lmro"),
  upload.single("document"), // Use Cloudinary upload middleware
  lmroApprove
);

// DLMRO Approval with document upload requirement using Cloudinary
router.put(
  "/jobs/:jobId/dlmro-approve",
  protect,
  checkPermission("kycManagement.dlmro"),
  upload.single("document"), // Use Cloudinary upload middleware
  dlmroApprove
);

// CEO Approval with document upload requirement using Cloudinary
router.put(
  "/jobs/:jobId/ceo-approve",
  protect,
  checkPermission("kycManagement.ceo"),
  upload.single("document"), // Use Cloudinary upload middleware
  ceoApprove
);

// Reject KYC (each role can only reject at their stage)
router.put("/jobs/:jobId/reject", protect, checkKycPermission, rejectKyc);

module.exports = router;
