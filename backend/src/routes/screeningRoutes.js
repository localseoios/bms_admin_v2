const express = require("express");
const router = express.Router();
const {
  getClientScreeningRecords,
  createScreeningRecord,
  updateScreeningRecord,
  getScreeningStatistics,
  uploadScreeningDocument,
  updateScreeningDocument,
  deleteScreeningDocument,
  deleteScreeningRecord,
} = require("../controllers/screeningController");
const { protect, checkPermission } = require("../middleware/authMiddleware");
const { upload } = require("../services/fileUploadService");

// Get screening records for a specific client by email
router.get("/client/:gmail", protect, getClientScreeningRecords);

// Get screening records for compliance (no auth required)
router.get("/compliance/client/:gmail", getClientScreeningRecords);

// Create new screening record
router.post("/", protect, createScreeningRecord);

// Update screening record
router.put("/:id", protect, updateScreeningRecord);

// Get screening statistics
router.get("/statistics", protect, getScreeningStatistics);

// Document management routes
router.post("/upload-document", protect, upload.single("file"), uploadScreeningDocument);
router.put("/documents/:id", protect, upload.single("file"), updateScreeningDocument);
router.delete("/documents/:id", protect, deleteScreeningDocument);

// Delete entire screening record
router.delete("/:id", protect, deleteScreeningRecord);

module.exports = router;