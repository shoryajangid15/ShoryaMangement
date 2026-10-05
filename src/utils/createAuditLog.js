const AuditLog = require("../models/auditLogs.models");
const Admin = require("../models/admin.models");

const createAuditLog = async ({ userId, adminId, projectId, action, entityType, entityId, details, userType }) => {
    try {
        let finalUserType = userType || "User";
        let finalAdminId = adminId || null;
        let finalUserId = userId || null;

        if (userId && !adminId && !userType) {
            try {
                const isAdmin = await Admin.findById(userId);
                if (isAdmin) {
                    finalAdminId = userId;
                    finalUserId = null;
                    finalUserType = "Admin";
                }
            } catch (e) {}
        }

        const logData = {
            adminId: finalAdminId,
            userId: finalUserId,
            userType: finalUserType,
            projectId: projectId || null,
            action,
            entityType: entityType || "System",
            entityId: entityId || null,
            details: details || {}
        };

        const created = await AuditLog.create(logData);
        return created;
    } catch (error) {
        console.error("Failed to create Audit Log:", error.message);
    }
};

module.exports = createAuditLog;
