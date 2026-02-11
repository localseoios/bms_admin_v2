const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const organizationalStructureController = require('../controllers/organizationalStructureController');
const { protect, checkPermission } = require('../middleware/authMiddleware');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'temp-uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /pdf|doc|docx|xls|xlsx|ppt|pptx|jpeg|jpg|png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, JPEG, and PNG files are allowed.'));
    }
  }
});

router.use(protect);
router.use(checkPermission('complianceManagement'));

router.get('/stats', organizationalStructureController.getStats);
router.get('/', organizationalStructureController.getAll);
router.get('/:id', organizationalStructureController.getById);

router.post('/', upload.array('documents', 10), organizationalStructureController.create);
router.put('/:id', upload.array('documents', 10), organizationalStructureController.update);
router.delete('/:id', organizationalStructureController.delete);

router.post('/:id/documents', upload.single('document'), organizationalStructureController.addDocument);
router.put('/:id/documents/:documentId', upload.single('document'), organizationalStructureController.replaceDocument);
router.delete('/:id/documents/:documentId', organizationalStructureController.deleteDocument);

module.exports = router;
