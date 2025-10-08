// routes/jobRoutes.js - FIXED IMPORT ISSUE
const express = require("express");
const router = express.Router();
const {
  protect,
  adminOnly,
  checkPermission,
} = require("../middleware/authMiddleware");
const {
  createJob,
  getAllJobs,
  getAllJobsAdmin,
  approveJob,
  rejectJob,
  resubmitJob,
  getJobTimeline,
  cancelJob,
  getAssignedJobs,
  getJobDetails,
  updateJob,
  checkJobNumber,
  searchJobsWithPersonDetails,
  addOtherDocument,
  deleteOtherDocument,
  replaceOtherDocument,
} = require("../controllers/jobController");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// REMOVED THE PROBLEMATIC IMPORT:
// const { checkJobNumber, updateJob } = require("../../../../bms_admin_v2/backend/src/controllers/jobController");

// Ensure temp directory exists
const tempDir = path.join(__dirname, "../temp-uploads");
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
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

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
    files: 12, // Max 12 files per request
  },
});

// Log request info for debugging
router.use((req, res, next) => {
  console.log(`Job route accessed: ${req.method} ${req.url}`);
  next();
});

// ===== SPECIFIC ROUTES FIRST =====

// Check job number availability route - MUST come before parameterized routes
router.get("/check-job-number/:jobNumber", protect, adminOnly, checkJobNumber);

// Get all jobs routes
router.get("/get-all-admin", protect, adminOnly, getAllJobsAdmin);
router.get("/", protect, checkPermission("complianceManagement"), getAllJobs);

// Get assigned jobs
router.get(
  "/assigned",
  protect,
  checkPermission("operationManagement"),
  getAssignedJobs
);

// Add this route to jobRoutes.js before the general routes
router.get(
  "/search", 
  protect, 
  checkPermission("complianceManagement"), 
  searchJobsWithPersonDetails
);

// ===== CREATE JOB ROUTE =====
router.post(
  "/",
  protect,
  adminOnly,
  (req, res, next) => {
    console.log("Processing job create request");
    upload.fields([
      { name: "documentPassport", maxCount: 1 },
      { name: "documentID", maxCount: 1 },
      { name: "otherDocuments", maxCount: 10 },
    ])(req, res, (err) => {
      if (err) {
        console.error("Upload error:", err.message);
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(413).json({
            message: "File too large",
            error: "Maximum file size is 50MB",
          });
        }
        return res.status(400).json({
          message: "File upload error",
          error: err.message,
        });
      }
      next();
    });
  },
  createJob
);

// ===== UPDATE JOB ROUTE - SIMPLIFIED AND FIXED =====
router.put(
  "/:id/update",
  protect,
  adminOnly,
  (req, res, next) => {
    console.log("=== UPDATE ROUTE HIT ===");
    console.log("Processing job update request for ID:", req.params.id);
    next();
  },
  upload.fields([
    { name: "documentPassport", maxCount: 1 },
    { name: "documentID", maxCount: 1 },
    { name: "otherDocuments", maxCount: 10 },
  ]),
  (req, res, next) => {
    console.log("=== AFTER MULTER ===");
    console.log("Files received:", req.files ? Object.keys(req.files) : "none");
    console.log("Body keys:", Object.keys(req.body));
    next();
  },
  updateJob
);

// ===== OTHER PARAMETERIZED ROUTES =====

// Job status management routes
router.put(
  "/:id/approve",
  protect,
  checkPermission("complianceManagement"),
  upload.single("approvalDocument"),
  approveJob
);

router.put(
  "/:id/reject",
  protect,
  checkPermission("complianceManagement"),
  upload.single("rejectionDocument"),
  rejectJob
);

router.put(
  "/:id/resubmit",
  protect,
  adminOnly,
  upload.fields([
    { name: "newDocumentPassport", maxCount: 1 },
    { name: "newDocumentID", maxCount: 1 },
    { name: "newOtherDocuments", maxCount: 10 },
  ]),
  resubmitJob
);

// Job cancellation route
router.put("/:id/cancel", protect, adminOnly, cancelJob);

// Job timeline route
router.get("/:id/timeline", protect, getJobTimeline);

// Other documents management routes
router.post(
  "/:id/other-documents",
  protect,
  checkPermission("operationManagement"),
  upload.single("document"),
  addOtherDocument
);

router.delete(
  "/:id/other-documents/:index",
  protect,
  checkPermission("operationManagement"),
  deleteOtherDocument
);

router.put(
  "/:id/other-documents/:index",
  protect,
  checkPermission("operationManagement"),
  upload.single("document"),
  replaceOtherDocument
);

// ===== GENERAL PARAMETERIZED ROUTES (LAST) =====

// Get specific job details - MUST BE LAST among parameterized routes
router.get(
  "/:id",
  protect,
  checkPermission("operationManagement"),
  getJobDetails
);

module.exports = router;
