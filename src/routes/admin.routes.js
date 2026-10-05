const express = require("express");
const router = express.Router();

const { loginAdmin, registerAdmin } = require("../controller/adminregisteration.controller");
const { getAuditLogs, createAuditLog } = require("../controller/auditLog.controller");

router.post("/login", loginAdmin);
router.post("/register", registerAdmin);

router.get("/audit-logs", getAuditLogs);
router.post("/audit-logs", createAuditLog);

module.exports = router;
