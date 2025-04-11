const express = require("express");
const router = express.Router();
const { protect, checkPermission } = require("../middleware/authMiddleware");
const {
  getServices,
  getServiceById,
  createService,
  updateService,
  deleteService,
} = require("../controllers/serviceController");

// All routes need authentication and admin permission
router
  .route("/")
  .get(protect,  getServices)
  .post(
    protect,
    checkPermission(["serviceManagement", "admin"]),
    createService
  );

router
  .route("/:id")
  .get(protect, checkPermission(["serviceManagement", "admin"]), getServiceById)
  .put(protect, checkPermission(["serviceManagement", "admin"]), updateService)
  .delete(
    protect,
    checkPermission(["serviceManagement", "admin"]),
    deleteService
  );

module.exports = router;
