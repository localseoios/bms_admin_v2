const express = require("express");
const router = express.Router();
const {
  getArchivesByClient,
  getAllArchives,
  getArchiveById,
  getArchiveStats,
  archiveDocument,
  deleteArchive,
} = require("../controllers/archiveController");
const { protect } = require("../middleware/authMiddleware");

router.get("/", protect, getAllArchives);
router.get("/stats", protect, getArchiveStats);
router.get("/client/:clientId", protect, getArchivesByClient);
router.get("/:id", protect, getArchiveById);
router.post("/", protect, archiveDocument);
router.delete("/:id", protect, deleteArchive);

module.exports = router;
