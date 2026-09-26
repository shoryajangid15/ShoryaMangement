const AuditLog = require("../models/auditLogs.models");

// Get all audit logs for Admin (with optional projectId filter)
const getAuditLogs = async (req, res) => {
    try {
        const { projectId } = req.query;

        const filter = {};
        if (projectId) {
            filter.projectId = projectId;
        }

        const logs = await AuditLog.find(filter)
            .populate("userId", "name email")
            .populate("adminId", "email")
            .populate("projectId", "name")
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: logs.length,
            data: logs
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch audit logs",
            error: error.message
        });
    }
};

module.exports = {
    getAuditLogs
};
