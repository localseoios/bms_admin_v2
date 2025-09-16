const express = require('express');
const router = express.Router();
const {
  getAllSections,
  updateSection,
  createSection,
  deleteSection,
  runCleanup
} = require('../controllers/sectionSettingsController');
const { protect, checkPermission } = require('../middleware/authMiddleware');

// Apply authentication to all routes
router.use(protect);
router.use(checkPermission('complianceManagement'));

// Routes
router.route('/')
  .get(getAllSections)
  .post(createSection);

router.route('/:sectionId')
  .put(updateSection)
  .delete(deleteSection);

// Temporary cleanup route
router.get('/cleanup/orphaned-documents', runCleanup);

module.exports = router;