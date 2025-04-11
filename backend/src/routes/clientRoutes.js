// routes/clientRoutes.js
const express = require("express");
const router = express.Router();
const {
  getClientByGmail,
  getEngagementLetterByGmail,
  getPersonDetailsByGmail,
  checkPersonDetailsInconsistencies,
  synchronizeClientPersonDetails,
  checkCompanyDetailsStatus,
  getAssignedClients, // Add the new function
} = require("../controllers/clientController");
const { protect, checkPermission } = require("../middleware/authMiddleware");

// Route to get clients assigned to current user (Operation Manager)
router.get(
  '/assigned',
  protect,
  checkPermission("operationManagement"),
  getAssignedClients
);


// Route to get client details by Gmail
router.get("/:gmail", protect, getClientByGmail);

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



module.exports = router;
