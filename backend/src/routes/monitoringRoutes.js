const express = require("express");
const router = express.Router();
const {
  getClientMonitoringDocuments,
  uploadMonitoringDocument,
  updateMonitoringDocument,
  deleteMonitoringDocument
} = require("../controllers/monitoringController");
const { protect } = require("../middleware/authMiddleware");
const { upload } = require("../services/fileUploadService");

// Get monitoring documents for a specific client by email
router.get("/client/:gmail", protect, getClientMonitoringDocuments);

// Get monitoring documents for compliance (no auth required for testing)
router.get("/compliance/client/:gmail", getClientMonitoringDocuments);

// Upload new monitoring document
router.post("/upload", protect, upload.single("file"), uploadMonitoringDocument);

// Update monitoring document
router.put("/:id", protect, upload.single("file"), updateMonitoringDocument);

// Delete monitoring document
router.delete("/:id", protect, deleteMonitoringDocument);

module.exports = router;