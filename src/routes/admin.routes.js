const express = require("express");
const router = express.Router();

const { loginAdmin } = require("../controller/adminregisteration.controller");

router.post("/login", loginAdmin);

module.exports = router;