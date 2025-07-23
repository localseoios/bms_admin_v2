// routes/operationRoutes.js - Fixed with correct middleware references
console.log("🚀 Loading operationRoutes.js");
const express = require("express");
const router = express.Router();
const { protect, checkPermission } = require("../middleware/authMiddleware");
const {
  getCompanyDetails,
  updateCompanyDetails,
  getPersonDetails,
  addPersonDetails,
  updatePersonDetails,
  deletePersonDetails,
  getKycDocuments,
  updateKycDocuments,
  uploadEngagementLetter,
  completeOperation,
  createPreApprovedJob,
  getPersonFieldHistory,
  getEngagementLetters,
  getClientEngagementLetters,
  getExpiringJobs,
  exportExpiringJobs,
  sendExpiryNotifications,
  getExpiringJobsForDashboard,
  getExpiringJobsStats,
  updateJobExpiryDate,
  deleteEngagementLetter,
  getJobDataByEmail,
} = require("../controllers/operationController");




// Import job controller functions for job number checking
const { checkJobNumber } = require("../controllers/jobController");

const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Configure multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const tempDir = path.join(__dirname, "../temp-uploads");
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    cb(null, tempDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

// Configure file filter
const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === "image/jpeg" ||
    file.mimetype === "image/png" ||
    file.mimetype === "application/pdf" ||
    file.mimetype === "application/msword" ||
    file.mimetype ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Unsupported file format. Only JPEG, PNG, PDF, DOC and DOCX are allowed."
      ),
      false
    );
  }
};

// Configure multer upload
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit
});

// ===== SPECIFIC ROUTES FIRST =====

// Job number checking route (reuse from job controller)
router.get(
  "/check-job-number/:jobNumber",
  protect,
  checkPermission("operationManagement"),
  checkJobNumber
);

// Email lookup for auto-fill functionality
console.log("🔵 Registering email lookup route: /lookup-by-email/:email");

// Simple test route without middleware
router.get("/test-simple", (req, res) => {
  res.json({ message: "Simple test works" });
});

router.get(
  "/lookup-by-email/:email",
  protect,
  checkPermission("operationManagement"),
  (req, res, next) => {
    console.log("📧 Email lookup route hit:", req.params.email);
    next();
  },
  getJobDataByEmail
);

// FIXED: Dashboard expiring jobs route - corrected middleware
router.get(
  "/dashboard/expiring-jobs",
  protect,
  checkPermission("operationManagement"),
  getExpiringJobsForDashboard
);

// FIXED: Expiring jobs stats route - corrected middleware
router.get(
  "/expiring-jobs/stats",
  protect,
  checkPermission("operationManagement"),
  getExpiringJobsStats
);

// FIXED: Update job expiry route - corrected middleware
router.put(
  "/jobs/:jobId/expiry",
  protect,
  checkPermission("operationManagement"),
  updateJobExpiryDate
);

// Keep the existing route for full management
router.get(
  "/expiring-jobs",
  protect,
  checkPermission("operationManagement"),
  getExpiringJobs
);

// Export expiring jobs to Excel
router.get(
  "/expiring-jobs/export",
  protect,
  checkPermission("operationManagement"),
  exportExpiringJobs
);

// Send expiry notifications manually
router.post(
  "/expiring-jobs/notify",
  protect,
  checkPermission("operationManagement"),
  sendExpiryNotifications
);

// Company Details Routes
router.get(
  "/jobs/:jobId/company-details",
  protect,
  checkPermission("operationManagement"),
  getCompanyDetails
);

router.put(
  "/jobs/:jobId/company-details",
  protect,
  checkPermission("operationManagement"),
  upload.fields([
    { name: "engagementLetters", maxCount: 1 },
    { name: "companyComputerCard", maxCount: 1 },
    { name: "taxCard", maxCount: 1 },
    { name: "crExtract", maxCount: 2 },
    { name: "scopeOfLicense", maxCount: 1 },
    { name: "articleOfAssociate", maxCount: 1 },
    { name: "certificateOfIncorporate", maxCount: 1 },
    { name: "companyMemo", maxCount: 5 }, // ADD THIS LINE - supports up to 5 files
  ]),
  updateCompanyDetails
);

// Person Details Routes (Director, Shareholder, Secretary, SEF)
router.get(
  "/jobs/:jobId/person-details/:personType",
  protect,
  checkPermission("operationManagement"),
  getPersonDetails
);

router.post(
  "/jobs/:jobId/person-details/:personType",
  protect,
  checkPermission("operationManagement"),
  upload.fields([
    { name: "visaCopy", maxCount: 1 },
    { name: "qidDoc", maxCount: 1 },
    { name: "nationalAddressDoc", maxCount: 1 },
    { name: "passportDoc", maxCount: 1 },
    { name: "cv", maxCount: 1 },
  ]),
  addPersonDetails
);

router.put(
  "/jobs/:jobId/person-details/:personType/:personId",
  protect,
  checkPermission("operationManagement"),
  upload.fields([
    { name: "visaCopy", maxCount: 1 },
    { name: "qidDoc", maxCount: 1 },
    { name: "nationalAddressDoc", maxCount: 1 },
    { name: "passportDoc", maxCount: 1 },
    { name: "cv", maxCount: 1 },
  ]),
  updatePersonDetails
);

router.delete(
  "/jobs/:jobId/person-details/:personType/:personId",
  protect,
  checkPermission("operationManagement"),
  deletePersonDetails
);

// KYC Documents Routes
router.get(
  "/jobs/:jobId/kyc-documents",
  protect,
  checkPermission("operationManagement"),
  getKycDocuments
);

// Add this route to retrieve all engagement letters for a job
router.get(
  "/jobs/:jobId/engagement-letters",
  protect,
  checkPermission("operationManagement"),
  getEngagementLetters
);

router.put(
  "/jobs/:jobId/kyc-documents",
  protect,
  checkPermission("operationManagement"),
  upload.array("kycDocuments", 10),
  updateKycDocuments
);

// Engagement Letter Route
router.post(
  "/jobs/:jobId/engagement-letter",
  protect,
  checkPermission("operationManagement"),
  upload.single("engagementLetter"),
  uploadEngagementLetter
);

router.put(
  "/jobs/:jobId/complete",
  protect,
  checkPermission("operationManagement"),
  completeOperation
);

// Updated Pre-Approved Job Route with enhanced file handling
router.post(
  "/pre-approved-job",
  protect,
  checkPermission("operationManagement"),
  (req, res, next) => {
    console.log("Processing pre-approved job creation request");
    
    // Create dynamic fields for multiple directors, shareholders, etc.
    const fields = [
      // Job documents (now optional)
      { name: "documentPassport", maxCount: 1 },
      { name: "documentID", maxCount: 1 },
      { name: "otherDocuments", maxCount: 10 },

      // Company documents
      { name: "engagementLetters", maxCount: 1 },
      { name: "companyComputerCard", maxCount: 1 },
      { name: "taxCard", maxCount: 1 },
      { name: "crExtract", maxCount: 2 },
      { name: "scopeOfLicense", maxCount: 1 },
      { name: "articleOfAssociate", maxCount: 1 },
      { name: "certificateOfIncorporate", maxCount: 1 },
      { name: "companyMemo", maxCount: 5 },

      // KYC and BRA documents
      { name: "kycDocuments", maxCount: 10 },
      { name: "braDocuments", maxCount: 10 },
    ];

    // Add indexed director document fields (support up to 10 directors)
    for (let i = 0; i < 10; i++) {
      fields.push(
        { name: `directorVisaCopy_${i}`, maxCount: 1 },
        { name: `directorQidDoc_${i}`, maxCount: 1 },
        { name: `directorNationalAddressDoc_${i}`, maxCount: 1 },
        { name: `directorPassportDoc_${i}`, maxCount: 1 },
        { name: `directorCv_${i}`, maxCount: 1 }
      );
    }

    // Add indexed shareholder document fields (support up to 10 shareholders)
    for (let i = 0; i < 10; i++) {
      fields.push(
        { name: `shareholderVisaCopy_${i}`, maxCount: 1 },
        { name: `shareholderQidDoc_${i}`, maxCount: 1 },
        { name: `shareholderNationalAddressDoc_${i}`, maxCount: 1 },
        { name: `shareholderPassportDoc_${i}`, maxCount: 1 },
        { name: `shareholderCv_${i}`, maxCount: 1 }
      );
    }

    // Add indexed secretary document fields (support up to 5 secretaries)
    for (let i = 0; i < 5; i++) {
      fields.push(
        { name: `secretaryVisaCopy_${i}`, maxCount: 1 },
        { name: `secretaryQidDoc_${i}`, maxCount: 1 },
        { name: `secretaryNationalAddressDoc_${i}`, maxCount: 1 },
        { name: `secretaryPassportDoc_${i}`, maxCount: 1 },
        { name: `secretaryCv_${i}`, maxCount: 1 }
      );
    }

    // Add indexed SEF document fields (support up to 5 SEFs)
    for (let i = 0; i < 5; i++) {
      fields.push(
        { name: `sefVisaCopy_${i}`, maxCount: 1 },
        { name: `sefQidDoc_${i}`, maxCount: 1 },
        { name: `sefNationalAddressDoc_${i}`, maxCount: 1 },
        { name: `sefPassportDoc_${i}`, maxCount: 1 },
        { name: `sefCv_${i}`, maxCount: 1 }
      );
    }

    console.log(`Configured ${fields.length} multer fields for file upload`);

    upload.fields(fields)(req, res, (err) => {
      if (err) {
        console.error("Upload error:", err.message);
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(413).json({
            message: "File too large",
            error: "Maximum file size is 100MB",
          });
        }
        return res.status(400).json({
          message: "File upload error",
          error: err.message,
        });
      }
      
      console.log("Files processed successfully");
      console.log("Received files:", Object.keys(req.files || {}));
      next();
    });
  },
  createPreApprovedJob
);

// Route to get history for a specific field
router.get(
  "/jobs/:jobId/person-details/:personType/:personId/history",
  protect,
  checkPermission("operationManagement"),
  getPersonFieldHistory
);

// Add this route with other routes
router.get(
  "/clients/:gmail/engagement-letters",
  protect,
  checkPermission("operationManagement"),
  getClientEngagementLetters
);

router.delete(
  "/jobs/:jobId/engagement-letter/:letterId",
  protect,
  checkPermission("operationManagement"),
  deleteEngagementLetter
);

console.log("✅ operationRoutes.js loaded, routes registered");
console.log("📋 Available functions:", { getJobDataByEmail: typeof getJobDataByEmail });

module.exports = router;
