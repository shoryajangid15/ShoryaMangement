const ProjectMember = require("../models/projectMembers.models");

// Middleware to check if user has required permission in a project
const checkPermission = (requiredPermission) => {
    return async (req, res, next) => {
        try {
            const projectId = req.body?.projectId || req.params?.projectId || req.query?.projectId;
            const userId = req.user?.id || req.body?.userId;

            if (!projectId || !userId) {
                return res.status(400).json({
                    success: false,
                    message: "projectId and userId are required to check permissions"
                });
            }

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
