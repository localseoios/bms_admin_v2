// Modified client routes to handle any email format
const express = require("express");
const router = express.Router();
const {
  getClientByGmail,
  getEngagementLetterByGmail,
  getPersonDetailsByGmail,
  checkPersonDetailsInconsistencies,
  synchronizeClientPersonDetails,
  checkCompanyDetailsStatus,
  getAssignedClients,
  getAllClients,
  updateClientRiskLevel,
  updateClientCddType,
  updateClientCrNo,
  deleteClient,
  getClientsByRole,
  exportComplianceClients,
  searchClientsWithDetails,
} = require("../controllers/clientController");
const { protect, checkPermission } = require("../middleware/authMiddleware");

// Route to get clients assigned to current user (Operation Manager)
router.get(
  '/assigned',
  protect,
  checkPermission("operationManagement"),
  getAssignedClients
);

// Route to get all clients (with appropriate permission)
router.get(
  "/all",
  protect,
  checkPermission("operationManagement"),
  getAllClients
);

// Route to get clients by user's role (service-based filtering)
router.get(
  "/my-role-clients",
  protect,
  getClientsByRole
);

// Route to get all clients for compliance (no auth needed for now)
router.get("/compliance/all", getAllClients);

// Route to search clients with person and company details
router.get("/compliance/search", searchClientsWithDetails);

// Route to export compliance clients to Excel format
router.get("/compliance/export", exportComplianceClients);

// Route to get client details by email (encoded in URL)
// Note: We keep the :gmail parameter name for backward compatibility
router.get("/:gmail", protect, getClientByGmail);

// Route to get client details for compliance (no auth needed for now)
router.get("/compliance/:gmail", getClientByGmail);

// New route to get engagement letter specifically
router.get("/:gmail/engagement-letter", protect, getEngagementLetterByGmail);

router.get(
  "/:gmail/person-details/:personType",
  protect,
  getPersonDetailsByGmail
);

// Route to check for inconsistencies
router.get(
  "/:gmail/check-inconsistencies",
  protect,
  checkPermission("operationManagement"),
  checkPersonDetailsInconsistencies
);

// Route to synchronize person details across jobs
router.post(
  "/:gmail/sync/:personType",
  protect,
  checkPermission("operationManagement"),
  synchronizeClientPersonDetails
);

// New route to check company details status
router.get(
  "/:gmail/company-details-status",
  protect,
  checkPermission("operationManagement"),
  checkCompanyDetailsStatus
);

// Route to update client risk level
router.put(
  "/:gmail/risk-level",
  protect,
  checkPermission("complianceManagement"),
  updateClientRiskLevel
);

// Route to update client CDD type
router.put(
  "/:gmail/cdd-type",
  protect,
  checkPermission("complianceManagement"),
  updateClientCddType
);

// Route to update client CR Number
router.put(
  "/:gmail/cr-no",
  protect,
  checkPermission("operationManagement"),
  updateClientCrNo
);

router.delete(
  "/:gmail",
  protect,
  checkPermission("operationManagement"),
  deleteClient
);

module.exports = router;