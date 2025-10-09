const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const {
  getAllDocuments,
  getDocument,
  createDocument,
  updateDocument,
  deleteDocument,
  getStatistics,
  archiveDocument,
  downloadDocument
} = require('../controllers/complianceCultureController');
const { protect, checkPermission } = require('../middleware/authMiddleware');

// Ensure temp-uploads directory exists
const uploadDir = path.join(__dirname, '..', 'temp-uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'culture-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'image/jpeg',
    'image/png'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, JPEG, and PNG files are allowed.'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  }
});

// Apply authentication to all routes
router.use(protect);
router.use(checkPermission('complianceManagement'));

// Statistics route (before parameterized routes)
router.get('/statistics', getStatistics);

// Main CRUD routes
router.route('/')
  .get(getAllDocuments)
  .post(upload.single('file'), createDocument);

router.route('/:id')
  .get(getDocument)
  .put(upload.single('file'), updateDocument)
  .delete(deleteDocument);

// Special action routes
router.put('/:id/archive', archiveDocument);
router.get('/:id/download', downloadDocument);

module.exports = router;