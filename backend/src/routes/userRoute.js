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
  getOperationManagers,
} = require("../controllers/userController");
const {
  protect,
  adminOnly,
  checkPermission,
} = require("../middleware/authMiddleware");

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


module.exports = router;
