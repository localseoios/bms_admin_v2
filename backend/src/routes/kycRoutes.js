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
  amlSupervisorUpload,
  dlmroSign,
  lmroSign,
  ceoSign,
  lmroApprove,
  dlmroApprove,
  ceoApprove,
  rejectKyc,
  getAllKycJobs,
  updateKycDocument,
  deleteKycDocument,
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

// Get KYC status for compliance (no auth required)
router.get("/compliance/jobs/:jobId/status", getKycStatus);

router.get("/jobs", protect, checkKycPermission, getAllKycJobs);

router.put(
  "/jobs/:jobId/aml-supervisor-upload",
  protect,
  checkPermission("kycManagement.amlSupervisor"),
  upload.single("document"),
  amlSupervisorUpload
);

router.put(
  "/jobs/:jobId/dlmro-sign",
  protect,
  checkPermission("kycManagement.dlmro"),
  dlmroSign
);

router.put(
  "/jobs/:jobId/lmro-sign",
  protect,
  checkPermission("kycManagement.lmro"),
  lmroSign
);

router.put(
  "/jobs/:jobId/ceo-sign",
  protect,
  checkPermission("kycManagement.ceo"),
  ceoSign
);

router.put(
  "/jobs/:jobId/lmro-approve",
  protect,
  checkPermission("kycManagement.lmro"),
  upload.single("document"),
  lmroApprove
);

router.put(
  "/jobs/:jobId/dlmro-approve",
  protect,
  checkPermission("kycManagement.dlmro"),
  upload.single("document"),
  dlmroApprove
);

router.put(
  "/jobs/:jobId/ceo-approve",
  protect,
  checkPermission("kycManagement.ceo"),
  upload.single("document"),
  ceoApprove
);

// Reject KYC (each role can only reject at their stage)
router.put("/jobs/:jobId/reject", protect, checkKycPermission, rejectKyc);

// NEW: Update KYC Document for specific stage
router.put(
  "/jobs/:jobId/documents/:stage/update",
  protect,
  upload.single("document"),
  updateKycDocument
);

// NEW: Delete KYC Document for specific stage
router.delete(
  "/jobs/:jobId/documents/:stage/delete",
  protect,
  deleteKycDocument
);

// Compliance routes (no auth required)
router.put(
  "/compliance/jobs/:jobId/documents/:stage/update",
  upload.single("document"),
  updateKycDocument
);

module.exports = router;