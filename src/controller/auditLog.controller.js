const AuditLog = require("../models/auditLogs.models");
const createAuditLog = require("../utils/createAuditLog");
const { getPaginationParams, formatPaginatedResponse } = require("../utils/paginate");

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

const createAuditLogController = async (req, res) => {
    try {
        const { userId, adminId, projectId, action, entityType, entityId, details, userType } = req.body;
        if (!action) {
            return res.status(400).json({
                success: false,
                message: "Action is required"
            });
        }
        const log = await createAuditLog({
            userId,
            adminId,
            projectId,
            action,
            entityType,
            entityId,
            details,
            userType
        });
        res.status(201).json({
            success: true,
            data: log
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to create audit log",
            error: error.message
        });
    }
};

module.exports = {
    getAuditLogs,
    createAuditLog: createAuditLogController
};
