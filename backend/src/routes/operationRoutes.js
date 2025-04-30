// routes/operationRoutes.js
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
} = require("../controllers/operationController");
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
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

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
    { name: "crExtract", maxCount: 1 },
    { name: "scopeOfLicense", maxCount: 1 },
    { name: "articleOfAssociate", maxCount: 1 },
    { name: "certificateOfIncorporate", maxCount: 1 },
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

router.post(
  "/pre-approved-job",
  protect,
  checkPermission("operationManagement"),
  upload.fields([
    // Job documents
    { name: "documentPassport", maxCount: 1 },
    { name: "documentID", maxCount: 1 },
    { name: "otherDocuments", maxCount: 10 },

    // Company documents
    { name: "engagementLetters", maxCount: 1 },
    { name: "companyComputerCard", maxCount: 1 },
    { name: "taxCard", maxCount: 1 },
    { name: "crExtract", maxCount: 1 },
    { name: "scopeOfLicense", maxCount: 1 },
    { name: "articleOfAssociate", maxCount: 1 },
    { name: "certificateOfIncorporate", maxCount: 1 },

    // Director documents (supporting multiple directors)
    { name: "directorVisaCopy", maxCount: 5 },
    { name: "directorQidDoc", maxCount: 5 },
    { name: "directorNationalAddressDoc", maxCount: 5 },
    { name: "directorPassportDoc", maxCount: 5 },
    { name: "directorCv", maxCount: 5 },

    // Shareholder documents
    { name: "shareholderVisaCopy", maxCount: 5 },
    { name: "shareholderQidDoc", maxCount: 5 },
    { name: "shareholderNationalAddressDoc", maxCount: 5 },
    { name: "shareholderPassportDoc", maxCount: 5 },
    { name: "shareholderCv", maxCount: 5 },

    // Secretary documents
    { name: "secretaryVisaCopy", maxCount: 5 },
    { name: "secretaryQidDoc", maxCount: 5 },
    { name: "secretaryNationalAddressDoc", maxCount: 5 },
    { name: "secretaryPassportDoc", maxCount: 5 },
    { name: "secretaryCv", maxCount: 5 },

    // SEF documents
    { name: "sefVisaCopy", maxCount: 5 },
    { name: "sefQidDoc", maxCount: 5 },
    { name: "sefNationalAddressDoc", maxCount: 5 },
    { name: "sefPassportDoc", maxCount: 5 },
    { name: "sefCv", maxCount: 5 },

    // KYC documents
    { name: "kycDocuments", maxCount: 10 },

    // BRA documents
    { name: "braDocuments", maxCount: 10 },
  ]),
  createPreApprovedJob
);

// Route to get history for a specific field
router.get(
  "/jobs/:jobId/person-details/:personType/:personId/history",
  protect,
  checkPermission("operationManagement"),
  getPersonFieldHistory
);

module.exports = router;
