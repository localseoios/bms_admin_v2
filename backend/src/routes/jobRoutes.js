// routes/jobRoutes.js
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
} = require("../controllers/jobController");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

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

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === "image/jpeg" ||
    file.mimetype === "image/png" ||
    file.mimetype === "application/pdf"
  ) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Unsupported file format. Only JPEG, PNG, and PDF are allowed."
      ),
      false
    );
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
});

// Existing routes
router.post(
  "/",
  protect,
  adminOnly,
  upload.fields([
    { name: "documentPassport", maxCount: 1 },
    { name: "documentID", maxCount: 1 },
    { name: "otherDocuments", maxCount: 10 },
  ]),
  createJob
);

router.get("/", protect, checkPermission("complianceManagement"), getAllJobs);
router.get("/get-all-admin", protect, adminOnly, getAllJobsAdmin);

// New route for assigned jobs
router.get(
  "/assigned",
  protect,
  checkPermission("operationManagement"),
  getAssignedJobs
);

// New route for specific job details (accessible by admin, compliance, and assigned person)
router.get(
  "/:id",
  protect,
  checkPermission("operationManagement"),
  getJobDetails
);

// Job status management routes
// Update the approve job route to use multer for file uploads
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

// New route for job cancellation
router.put(
  "/:id/cancel",
  protect,
  adminOnly, // Only admins can cancel jobs
  cancelJob
);

// Job timeline route
router.get("/:id/timeline", protect, getJobTimeline);






module.exports = router;