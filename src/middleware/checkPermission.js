const ProjectMember = require("../models/projectMembers.models");
const Admin = require("../models/admin.models");
const File = require("../models/file.models");

// Middleware to check if user has required permission in a project
const checkPermission = (requiredPermission) => {
    return async (req, res, next) => {
        try {
            let projectId = req.body?.projectId || req.params?.projectId || req.query?.projectId;
            const userId = req.user?.id || req.body?.userId || req.query?.userId || req.headers?.userid;

            // If fileId is present in params (e.g. Delete route), get projectId from File model
            if (!projectId && req.params?.fileId) {
                const file = await File.findById(req.params.fileId);
                if (file) projectId = file.projectId;
            }

            if (!projectId || !userId) {
                return res.status(400).json({
                    success: false,
                    message: "projectId and userId are required to check permissions"
                });
            }

            // 👑 Admin Bypass Check (System Admin gets full access)
            if (req.user?.role === "admin") {
                return next();
            }
            const isAdmin = await Admin.findById(userId);
            if (isAdmin) {
                return next();
            }

            // Normal User Permission Check
            const member = await ProjectMember.findOne({ projectId, userId });

            if (!member) {
                return res.status(403).json({
                    success: false,
                    message: "Access Denied: You are not a member of this project"
                });
            }

            if (!member.permissions.includes(requiredPermission)) {
                return res.status(403).json({
                    success: false,
                    message: `Access Denied: You do not have '${requiredPermission}' permission in this project`
                });
            }

            next();
        } catch (error) {
            res.status(500).json({
                success: false,
                message: "Permission check failed",
                error: error.message
            });
        }
    };
};

module.exports = checkPermission;
