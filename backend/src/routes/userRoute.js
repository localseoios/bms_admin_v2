const express = require("express");
const router = express.Router();
const {
  getUsers,
  createUser,
  getUser,
  updateUser,
  deleteUser,
  resetUserPassword,
  getCurrentUser,
  updateCurrentUser,
  changePassword,
  getOnlineUsers,
  getOperationManagers,
  getUsersByServiceType,
  getDashboardUsers,
  getUsersWithSignaturePermissions,
  uploadUserSignature,
  deleteUserSignature,
} = require("../controllers/userController");
const {
  protect,
  adminOnly,
  checkPermission,
} = require("../middleware/authMiddleware");
const { upload } = require("../services/fileUploadService");

// Self-management routes (accessible to any authenticated user)
router.get("/me", protect, getCurrentUser); // View own profile
router.put("/me", protect, updateCurrentUser); // Update own profile
router.put("/me/password", protect, changePassword); // Change own password

// User management routes (accessible to users with userManagement: true)
router
  .route("/")
  .get(protect, checkPermission("userManagement"), getUsers) // List all users
  .post(protect, checkPermission("userManagement"), createUser); // Create a user

router.get("/operation-managers", protect, getOperationManagers);

// Route to get users by service type (users with roles assigned to the service)
router.get("/by-service/:serviceName", protect, getUsersByServiceType);

// Route to get online users
router.get("/online", protect, getOnlineUsers);

// Route for dashboard - accessible to all authenticated users
router.get("/dashboard-users", protect, getDashboardUsers);

// Route to get users with signature permissions (MUST be before /:id route)
router.get(
  "/with-signature-permissions",
  protect,
  checkPermission("userManagement"),
  getUsersWithSignaturePermissions
);

router
  .route("/:id")
  .get(protect, checkPermission("userManagement"), getUser) // View a specific user
  .put(protect, checkPermission("userManagement"), updateUser) // Update a user
  .delete(protect, checkPermission("userManagement"), deleteUser); // Delete a user

// Admin-only routes (example: resetting passwords remains admin-only)
router.post(
  "/reset-password",
  protect,
  checkPermission("userManagement"),
  resetUserPassword
);

router.put(
  "/:id/signature",
  protect,
  checkPermission("userManagement"),
  upload.single("signature"),
  uploadUserSignature
);

router.delete(
  "/:id/signature",
  protect,
  checkPermission("userManagement"),
  deleteUserSignature
);

module.exports = router;
