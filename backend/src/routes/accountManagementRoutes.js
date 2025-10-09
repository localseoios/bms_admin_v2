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
  updatePaymentInvoice,
  addPaymentInvoice,
  deletePaymentInvoice,
} = require("../controllers/accountManagementController");
const {
  getPaymentEligibleJobs,
  getAllPaymentRecords,
} = require("../controllers/monthlyPaymentController");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Log route file loading
console.log("🚀 Loading Account Management Routes...");

// Ensure temp uploads directory exists
const tempDir = path.join(__dirname, "../temp-uploads");
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
  console.log("📁 Created temp uploads directory:", tempDir);
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
        success: false,
        status: "error",
        message: "File is too large. Maximum size is 5MB.",
      });
    }
    return res.status(400).json({
      success: false,
      status: "error",
      message: `Upload error: ${err.message}`,
    });
  } else if (err) {
    return res.status(500).json({
      success: false,
      status: "error",
      message: `Server error during upload: ${err.message}`,
    });
  }
  next();
};

// Add request logging middleware for debugging
router.use((req, res, next) => {
  console.log(`📥 Account Management Route: ${req.method} ${req.originalUrl}`);
  console.log(`📋 Headers: ${JSON.stringify(req.headers, null, 2)}`);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log(`📄 Body: ${JSON.stringify(req.body, null, 2)}`);
  }
  if (req.params && Object.keys(req.params).length > 0) {
    console.log(`🎯 Params: ${JSON.stringify(req.params, null, 2)}`);
  }
  next();
});

// Test route to verify routes are working
router.get("/test", (req, res) => {
  console.log("✅ Test route hit successfully!");
  res.json({
    success: true,
    message: "Account Management routes are working!",
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.originalUrl,
  });
});
console.log("✅ Test route registered: GET /test");

// Dashboard stats for account management
router.get(
  "/dashboard",
  protect,
  checkPermission("accountManagement"),
  getDashboardStats
);
console.log("✅ Dashboard route registered: GET /dashboard");

// Upload invoice route with error handling
router.post(
  "/payments/upload-invoice",
  protect,
  checkPermission("accountManagement"),
  upload.single("invoiceFile"),
  handleUploadErrors,
  uploadInvoiceDocument
);
console.log("✅ Upload invoice route registered: POST /payments/upload-invoice");

// Get jobs eligible for payment (operation completed or with existing payments)
router.get(
  "/jobs/payment-eligible",
  protect,
  checkPermission("accountManagement"),
  getPaymentEligibleJobs
);
console.log("✅ Payment eligible jobs route registered: GET /jobs/payment-eligible");

// Get all payment records with filtering and search
router.get(
  "/payments",
  protect,
  checkPermission("accountManagement"),
  getAllPaymentRecords
);
console.log("✅ Get all payments route registered: GET /payments");

// Get payment reports with advanced filtering
router.get(
  "/reports",
  protect,
  checkPermission("accountManagement"),
  getPaymentReports
);
console.log("✅ Reports route registered: GET /reports");

// Create or update payment record with error handling
router.post(
  "/payments",
  protect,
  checkPermission("accountManagement"),
  upload.array("invoiceFiles", 10),
  handleUploadErrors,
  createUpdatePaymentRecord
);
console.log("✅ Create/update payment route registered: POST /payments");

// Update payment status
router.patch(
  "/payments/:id/status",
  protect,
  checkPermission("accountManagement"),
  updatePaymentStatus
);
console.log("✅ Update payment status route registered: PATCH /payments/:id/status");

// Add a new invoice to an existing payment record
router.post(
  "/payments/:paymentId/invoices",
  protect,
  checkPermission("accountManagement"),
  upload.single("invoiceFile"),
  handleUploadErrors,
  (req, res, next) => {
    console.log("🆕 ADD INVOICE ROUTE HIT!");
    console.log(`💳 Payment ID: ${req.params.paymentId}`);
    console.log(`📝 Form Data:`, req.body);
    console.log(`📎 File:`, req.file ? req.file.originalname : "No file uploaded");
    next();
  },
  addPaymentInvoice
);
console.log("✅ Add payment invoice route registered: POST /payments/:paymentId/invoices");

// Update a specific invoice within a payment record
router.put(
  "/payments/:paymentId/invoices/:invoiceId",
  protect,
  checkPermission("accountManagement"),
  upload.single("invoiceFile"),
  handleUploadErrors,
  (req, res, next) => {
    console.log("=== UPDATE INVOICE ROUTE HIT ===");
    console.log(`💳 Payment ID: ${req.params.paymentId}`);
    console.log(`🧾 Invoice ID: ${req.params.invoiceId}`);
    console.log(`📝 Form Data:`, req.body);
    console.log(`🏷️ Currency in body:`, req.body.currency);
    console.log(`📎 File:`, req.file ? req.file.originalname : "No file uploaded");
    console.log("=== END ROUTE INFO ===");
    next();
  },
  updatePaymentInvoice
);
console.log("✅ Update payment invoice route registered: PUT /payments/:paymentId/invoices/:invoiceId");

// Delete a specific invoice from a payment record
router.delete(
  "/payments/:paymentId/invoices/:invoiceId",
  protect,
  checkPermission("accountManagement"),
  (req, res, next) => {
    console.log("🗑️ DELETE INVOICE ROUTE HIT!");
    console.log(`💳 Payment ID: ${req.params.paymentId}`);
    console.log(`🧾 Invoice ID: ${req.params.invoiceId}`);
    next();
  },
  deletePaymentInvoice
);
console.log("✅ Delete payment invoice route registered: DELETE /payments/:paymentId/invoices/:invoiceId");

// Catch-all middleware for unmatched routes within this router
router.use("*", (req, res) => {
  console.log("❌ UNMATCHED ROUTE in Account Management:");
  console.log(`   Method: ${req.method}`);
  console.log(`   Original URL: ${req.originalUrl}`);
  console.log(`   Base URL: ${req.baseUrl}`);
  console.log(`   Route Path: ${req.route ? req.route.path : 'No route'}`);
  
  res.status(404).json({
    success: false,
    message: "Route not found in Account Management",
    method: req.method,
    path: req.originalUrl,
    availableRoutes: [
      "GET /test",
      "GET /dashboard",
      "POST /payments/upload-invoice",
      "GET /jobs/payment-eligible", 
      "GET /payments",
      "GET /reports",
      "POST /payments",
      "PATCH /payments/:id/status",
      "POST /payments/:paymentId/invoices",
      "PUT /payments/:paymentId/invoices/:invoiceId",
      "DELETE /payments/:paymentId/invoices/:invoiceId"
    ],
    timestamp: new Date().toISOString()
  });
});

console.log("🎉 Account Management Routes setup complete!");

module.exports = router;