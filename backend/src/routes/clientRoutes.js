const express = require("express");
const router = express.Router();
const { getClientByGmail } = require("../controllers/clientController");

router.get("/:gmail", getClientByGmail);

module.exports = router;
