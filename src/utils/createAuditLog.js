const AuditLog = require("../models/auditLogs.models");
const Admin = require("../models/admin.models");

/**
 * Helper to log user/admin activities into AuditLog collection
 */
const createAuditLog = async ({ userId, projectId, action, entityType, entityId, details }) => {
    try {
        if (!userId) return;

        // Check if performing user is System Admin or normal User
        const isAdmin = await Admin.findById(userId);

        const logData = {
            projectId: projectId || null,
            action,
            entityType,
            entityId: entityId || null,
            details: details || {}
        };

        if (isAdmin) {
            logData.adminId = userId;
            logData.userType = "Admin";
        } else {
            logData.userId = userId;
            logData.userType = "User";
        }

        await AuditLog.create(logData);
    } catch (error) {
        console.error("Failed to create Audit Log:", error.message);
    }
};

module.exports = createAuditLog;
