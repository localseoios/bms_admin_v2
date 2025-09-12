const express = require('express');
const router = express.Router();
const {
  getSectionDocuments,
  uploadSectionDocument,
  updateSectionDocument,
  deleteSectionDocument,
  getClientAllSectionDocuments
} = require('../controllers/sectionDocumentController');
const { protect } = require('../middleware/authMiddleware');
const { upload } = require('../services/fileUploadService');

// Get all section documents for a client
router.get('/client/:clientEmail', getClientAllSectionDocuments);

// Get documents for a specific section and client
router.get('/:sectionId/client/:clientEmail', getSectionDocuments);

// Upload document to a section (with auth)
router.post('/upload', protect, upload.single('file'), uploadSectionDocument);

// Update section document (with auth)
router.put('/:documentId', protect, upload.single('file'), updateSectionDocument);

// Delete section document (with auth)
router.delete('/:documentId', protect, deleteSectionDocument);

module.exports = router;