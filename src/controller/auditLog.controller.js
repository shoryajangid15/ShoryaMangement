const AuditLog = require("../models/auditLogs.models");
const { getPaginationParams, formatPaginatedResponse } = require("../utils/paginate");

// Get all audit logs for Admin (with optional projectId filter and pagination)
const getAuditLogs = async (req, res) => {
    try {
        const { projectId } = req.query;
        const { page, limit, skip } = getPaginationParams(req.query);

        const filter = {};
        if (projectId) {
            filter.projectId = projectId;
        }

        const total = await AuditLog.countDocuments(filter);

        const logs = await AuditLog.find(filter)
            .populate("userId", "name email")
            .populate("adminId", "email")
            .populate("projectId", "name")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        res.status(200).json({
            success: true,
            ...formatPaginatedResponse({ data: logs, total, page, limit })
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
