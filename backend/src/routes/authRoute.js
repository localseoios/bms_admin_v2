const express = require("express");
const router = express.Router();
const {
  registerUser,
  loginUser,
  logout,
} = require("../controllers/userController");

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/logout", logout);
router.post("/logout", logout); // Support both GET and POST for logout

module.exports = router;
