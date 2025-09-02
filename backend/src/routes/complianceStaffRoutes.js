const express = require("express");
const router = express.Router();
const {
  getAllComplianceStaff,
  getComplianceStaffById,
  createComplianceStaff,
  updateComplianceStaff,
  deleteComplianceStaff,
  getAvailableUsers,
  getStaffStatistics,
  getRoleStatistics,
  addStaffSection,
  uploadStaffDocument,
  deleteStaffDocument,
  updateStaffDocument,
  replaceStaffDocument,
} = require("../controllers/complianceStaffController");
const { protect } = require("../middleware/authMiddleware");
const { upload } = require("../services/fileUploadService");
const multer = require('multer');

router.use(protect);

// Specific routes must come before parameterized routes
router.get("/", getAllComplianceStaff);
router.get("/statistics", getStaffStatistics);
router.get("/roles", getRoleStatistics);
router.get("/available-users", getAvailableUsers);

// Document management routes  
router.post("/upload-document", upload.single("file"), (req, res, next) => {
  // Manual form data parsing for missing fields
  console.log('=== MULTER DEBUG ===');
  console.log('req.body:', req.body);
  console.log('req.file:', req.file ? 'EXISTS' : 'MISSING');
  
  // Try to extract missing fields from the raw body if they exist
  if (req.headers['content-type'] && req.headers['content-type'].includes('multipart/form-data')) {
    // Handle missing form fields manually - for development/debug only
    if (!req.body.expireDate && req.rawBody) {
      // This is a temp fix, ideally should fix multer config
      console.log('Attempting manual form field extraction...');
    }
  }
  console.log('===================');
  next();
}, uploadStaffDocument);
router.delete("/delete-document", deleteStaffDocument);
router.put("/update-document", updateStaffDocument);
router.post("/replace-document", upload.single("file"), replaceStaffDocument);
router.post("/add-section", addStaffSection);

// Staff management routes (parameterized routes come last)
router.post("/", createComplianceStaff);
router.get("/:id", getComplianceStaffById);
router.put("/:id", updateComplianceStaff);
router.delete("/:id", deleteComplianceStaff);

module.exports = router;