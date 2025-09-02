const express = require("express");
const router = express.Router();
const {
  getClientScreeningRecords,
  createScreeningRecord,
  updateScreeningRecord,
  getScreeningStatistics,
} = require("../controllers/screeningController");
const { protect, checkPermission } = require("../middleware/authMiddleware");

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

module.exports = router;