const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { upload } = require("../services/fileUploadService");
const {
  getChatUsers,
  getMessages,
  sendMessage,
  getUnreadCount,
} = require("../controllers/chatController");

router.get("/users", protect, getChatUsers);
router.get("/unread-count", protect, getUnreadCount);
router.get("/messages/:otherUserId", protect, getMessages);
router.post("/messages", protect, upload.single("file"), sendMessage);

module.exports = router;
