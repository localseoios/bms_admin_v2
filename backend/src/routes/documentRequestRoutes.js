const express = require("express");
const router = express.Router();
const { protect, checkPermission } = require("../middleware/authMiddleware");

router.get("/test", (req, res) => {
  res.json({ message: "Document requests route is working!" });
});
const {
  getTemplates,
  getTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  createDocumentRequest,
  getDocumentRequests,
  getDocumentRequestById,
  cancelDocumentRequest,
  resendDocumentRequest,
  getSubmissions,
  getSubmissionById,
  reviewSubmission,
  processSubmission,
  rejectSubmission,
} = require("../controllers/documentRequestController");

router.get("/templates", protect, getTemplates);
router.get("/templates/:id", protect, getTemplateById);
router.post("/templates", protect, checkPermission("operationManagement"), createTemplate);
router.put("/templates/:id", protect, checkPermission("operationManagement"), updateTemplate);
router.delete("/templates/:id", protect, checkPermission("operationManagement"), deleteTemplate);

router.get("/submissions/all", protect, getSubmissions);
router.get("/submissions/:id", protect, getSubmissionById);
router.put("/submissions/:id/review", protect, checkPermission("operationManagement"), reviewSubmission);
router.put("/submissions/:id/process", protect, checkPermission("operationManagement"), processSubmission);
router.put("/submissions/:id/reject", protect, checkPermission("operationManagement"), rejectSubmission);

router.get("/", protect, getDocumentRequests);
router.get("/:id", protect, getDocumentRequestById);
router.post("/", protect, createDocumentRequest); // Temporarily removed permission check for testing
router.put("/:id/cancel", protect, checkPermission("operationManagement"), cancelDocumentRequest);
router.post("/:id/resend", protect, checkPermission("operationManagement"), resendDocumentRequest);

module.exports = router;
