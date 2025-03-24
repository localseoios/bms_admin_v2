// routes/roleRoute.js
const express = require("express");
const router = express.Router();
const { protect, adminOnly, checkPermission } = require("../middleware/authMiddleware");
const {
  getRoles,
  createRole,
  getRole,
  updateRole,
  deleteRole,
} = require("../controllers/roleController");

router
  .route("/")
  .get(protect, checkPermission("userManagement"), getRoles) // Protect the route
  .post(protect, checkPermission("userManagement"), createRole); // Only allow admins to create roles

router
  .route("/:id")
  .get(protect, checkPermission("userManagement"), getRole)
  .put(protect, checkPermission("userManagement"), updateRole)
  .delete(protect, checkPermission("userManagement"), deleteRole);

module.exports = router;
