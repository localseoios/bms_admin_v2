// routes/financialDocumentRoutes.js
const express = require("express");
const multer = require("multer");
const path = require("path");
const asyncHandler = require("express-async-handler");
const router = express.Router();

const {
  getCompaniesWithDocuments,
  getFinancialDocuments,
  getFinancialDocumentByYear,
  createOrUpdateFinancialDocument,
  updateFinancialDocument,
  updateDocumentFile,
  deleteDocumentFile,
  deleteFinancialDocument,
  getYearsByCompany,
  getAllClients
} = require("../controllers/financialDocumentController");

const { protect, checkPermission } = require("../middleware/authMiddleware");

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, "../temp-uploads");
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, `financial_doc_${uniqueSuffix}${extension}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit per file
    files: 3 // Maximum 3 files per upload
  },
  fileFilter: (req, file, cb) => {
    // Allow common document formats
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'image/jpeg',
      'image/png',
      'image/jpg'
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOC, DOCX, XLS, XLSX, JPG, JPEG, and PNG files are allowed.'), false);
    }
  }
});

// Special middleware to check ONLY Audited Financial permissions - no admin bypass
const checkFinancialDocumentPermission = asyncHandler(async (req, res, next) => {
  const user = req.user;

  if (!user || !user.role) {
    console.error("No user or role found in request");
    res.status(401);
    throw new Error("Not authorized");
  }

  // Check ONLY for Audited Financial permissions - NO admin bypass for financial documents
  const hasViewerPermission = user.role.permissions?.clientManagement?.auditedFinancial?.viewer === true;
  const hasEditorPermission = user.role.permissions?.clientManagement?.auditedFinancial?.editor === true;
  
  if (hasViewerPermission || hasEditorPermission) {
    console.log(`User ${user.email} has Audited Financial access`);
    return next();
  }

  console.error(`User ${user.email} lacks Audited Financial permission for financial documents`);
  res.status(403);
  throw new Error("Forbidden: Only users with Audited Financial permissions can access financial documents");
});

// Routes

// GET /api/financial-documents/clients - Get all clients for dropdown
router.get(
  "/clients",
  protect,
  checkFinancialDocumentPermission,
  getAllClients
);

// GET /api/financial-documents/:documentType/companies - Get companies with documents
router.get(
  "/:documentType/companies",
  protect,
  checkFinancialDocumentPermission,
  getCompaniesWithDocuments
);

// GET /api/financial-documents/:documentType/years - Get years by company
router.get(
  "/:documentType/years",
  protect,
  checkFinancialDocumentPermission,
  getYearsByCompany
);

// GET /api/financial-documents/:documentType - Get all documents by type and company
router.get(
  "/:documentType",
  protect,
  checkFinancialDocumentPermission,
  getFinancialDocuments
);

// GET /api/financial-documents/:documentType/:year - Get document by year and company
router.get(
  "/:documentType/:year",
  protect,
  checkFinancialDocumentPermission,
  getFinancialDocumentByYear
);

// POST /api/financial-documents/:documentType - Create or add to financial document
router.post(
  "/:documentType",
  protect,
  checkFinancialDocumentPermission,
  upload.array('documents', 3), // Accept up to 3 files
  createOrUpdateFinancialDocument
);

// PUT /api/financial-documents/:documentType/:year - Update document description
router.put(
  "/:documentType/:year",
  protect,
  checkFinancialDocumentPermission,
  updateFinancialDocument
);

// PUT /api/financial-documents/:documentType/:year/:fileId - Update individual file
router.put(
  "/:documentType/:year/:fileId",
  protect,
  checkFinancialDocumentPermission,
  upload.single('document'), // Accept single file for replacement
  updateDocumentFile
);

// DELETE /api/financial-documents/:documentType/:year/:fileId - Delete individual file
router.delete(
  "/:documentType/:year/:fileId",
  protect,
  checkFinancialDocumentPermission,
  deleteDocumentFile
);

// DELETE /api/financial-documents/:documentType/:year - Delete entire year record
router.delete(
  "/:documentType/:year",
  protect,
  checkFinancialDocumentPermission,
  deleteFinancialDocument
);

// Error handling middleware for multer errors
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 50MB per file.'
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files. Maximum 3 files allowed per upload.'
      });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'Unexpected field name for file upload.'
      });
    }
  }
  
  if (err.message.includes('Invalid file type')) {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }

  next(err);
});

module.exports = router;