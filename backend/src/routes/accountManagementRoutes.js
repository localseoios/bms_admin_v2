// routes/accountManagementRoutes.js
const express = require("express");
const router = express.Router();
const { protect, checkPermission } = require("../middleware/authMiddleware");
const {
  getDashboardStats,
  createUpdatePaymentRecord,
  updatePaymentStatus,
  getPaymentReports,
  uploadInvoiceDocument,
} = require("../controllers/accountManagementController");
const {
  getPaymentEligibleJobs,
  getAllPaymentRecords,
} = require("../controllers/monthlyPaymentController");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Ensure temp uploads directory exists
const tempDir = path.join(__dirname, "../temp-uploads");
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, tempDir);
  },
  filename: function (req, file, cb) {
    // Create a safe filename
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    // Handle non-Latin characters in filenames
    const safeFilename = Buffer.from(file.originalname, "latin1")
      .toString("utf8")
      .replace(/[^a-zA-Z0-9-_.]/g, "_");

    cb(null, `payment-${uniqueSuffix}${path.extname(safeFilename)}`);
  },
});

// Configure file filter
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "image/jpeg",
    "image/png",
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Unsupported file format. Only PDF, Word, Excel, and image files are allowed."
      ),
      false
    );
  }
};

// Configure multer upload with improved error handling
const uploadConfig = {
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
};

// Create multer instance
const upload = multer(uploadConfig);

// Add error handling for file uploads
const handleUploadErrors = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        status: "error",
        message: "File is too large. Maximum size is 5MB.",
      });
    }
    return res.status(400).json({
      status: "error",
      message: `Upload error: ${err.message}`,
    });
  } else if (err) {
    return res.status(500).json({
      status: "error",
      message: `Server error during upload: ${err.message}`,
    });
  }
  next();
};

// Dashboard stats for account management
router.get(
  "/dashboard",
  protect,
  checkPermission("accountManagement"),
  getDashboardStats
);

// Upload invoice route with error handling
router.post(
  "/payments/upload-invoice",
  protect,
  checkPermission("accountManagement"),
  upload.single("invoiceFile"),
  handleUploadErrors,
  uploadInvoiceDocument
);

// Get jobs eligible for payment (operation completed or with existing payments)
router.get(
  "/jobs/payment-eligible",
  protect,
  checkPermission("accountManagement"),
  getPaymentEligibleJobs
);

// Get all payment records with filtering and search
router.get(
  "/payments",
  protect,
  checkPermission("accountManagement"),
  getAllPaymentRecords
);

// Get payment reports with advanced filtering
router.get(
  "/reports",
  protect,
  checkPermission("accountManagement"),
  getPaymentReports
);

// Create or update payment record with error handling
router.post(
  "/payments",
  protect,
  checkPermission("accountManagement"),
  upload.array("invoiceFiles", 10),
  handleUploadErrors,
  createUpdatePaymentRecord
);

// Update payment status
router.patch(
  "/payments/:id/status",
  protect,
  checkPermission("accountManagement"),
  updatePaymentStatus
);

module.exports = router;
