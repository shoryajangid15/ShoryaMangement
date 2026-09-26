const express = require("express");
const router = express.Router();

const { loginAdmin, registerAdmin } = require("../controller/adminregisteration.controller");
const { getAuditLogs } = require("../controller/auditLog.controller");

router.post("/login", loginAdmin);
router.post("/register", registerAdmin);

// Audit Logs route for Admin
router.get("/audit-logs", getAuditLogs);

module.exports = router;