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

module.exports = router;
