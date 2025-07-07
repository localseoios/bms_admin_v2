// routes/financialDocumentRoutes.js
const express = require("express");
const multer = require("multer");
const path = require("path");
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

// Middleware to check if user has permission to manage financial documents
const checkFinancialDocumentPermission = checkPermission([
  "operationManagement",
  "complianceManagement", 
  "kycManagement.lmro",
  "braManagement.lmro"
]);

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