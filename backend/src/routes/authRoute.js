const express = require("express");
const router = express.Router();
const {
  registerUser,
  loginUser,
  logout,
  requestPasswordReset,
  resetPasswordWithCode,
  verify2FA,
} = require("../controllers/userController");

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/verify-2fa", verify2FA);
router.get("/logout", logout);
router.post("/logout", logout); // Support both GET and POST for logout
router.post("/forgot-password", requestPasswordReset);
router.post("/reset-password", resetPasswordWithCode);

module.exports = router;
