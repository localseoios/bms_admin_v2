// routes/monthlyPaymentRoutes.js
const express = require("express");
const router = express.Router();
const { protect, checkPermission } = require("../middleware/authMiddleware");
const {
  addMonthlyPayment,
  getPaymentHistory,
  updateMonthlyPayment,
  deleteMonthlyPayment,
  getMonthlyPaymentById,
  testCloudinaryUpload,
  getPaymentStatistics,
  getPaymentEligibleJobs,
  getAllPaymentRecords,
} = require("../controllers/monthlyPaymentController");
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
    // Create a safe filename
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const safeFilename = Buffer.from(file.originalname, "latin1")
      .toString("utf8")
      .replace(/[^a-zA-Z0-9-_.]/g, "_");

    cb(null, `payment-${uniqueSuffix}${path.extname(safeFilename)}`);
  },
});

// Configure file filter
const fileFilter = (req, file, cb) => {
  // Accept common document formats
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

// Configure multer upload
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

// Routes
router.post(
  "/add",
  protect,
  checkPermission("operationManagement"),
  upload.array("invoiceFiles", 10), // Allow up to 10 files
  addMonthlyPayment
);

router.get("/history/:jobId", protect, getPaymentHistory);

// Changed from '/statistics' to '/stats' to avoid conflict with MongoDB _id lookup
router.get("/stats", protect, getPaymentStatistics);

// Must place specific routes like '/stats' BEFORE parameterized routes like '/:id'
// to prevent MongoDB from trying to interpret 'statistics' as an ObjectId
router.get(
  "/:id",
  protect,
  checkPermission("operationManagement"),
  getMonthlyPaymentById
);

router.put(
  "/:id",
  protect,
  checkPermission("operationManagement"),
  upload.array("invoiceFiles", 10),
  updateMonthlyPayment
);

router.delete(
  "/:id",
  protect,
  checkPermission("operationManagement"),
  deleteMonthlyPayment
);

// Test route for Cloudinary upload
router.post(
  "/test-upload",
  protect,
  upload.single("testFile"),
  testCloudinaryUpload
);

// Add the new payment-eligible route to your existing job routes file
router.get(
  "/payment-eligible",
  protect,
  checkPermission("accountManagement"), // Adjust permission as needed
  getPaymentEligibleJobs
);
router.get(
  "/all",
  protect,
  checkPermission("accountManagement"), // Adjust permission as needed
  getAllPaymentRecords
);

module.exports = router;
