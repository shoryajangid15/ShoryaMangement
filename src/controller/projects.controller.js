const fs = require("fs");
const Project = require("../models/projects.models");
const ProjectMember = require("../models/projectMembers.models");
const User = require("../models/users.models");
const Invitation = require("../models/invitation.models");
const File = require("../models/file.models");
const createAuditLog = require("../utils/createAuditLog");
const generateJoinCode = require("../utils/generateJoinCode");
const { getPaginationParams, formatPaginatedResponse } = require("../utils/paginate");

// 1. Create a New Project (Only Admin)
const createProject = async (req, res) => {
    try {
        const { name, description, createdBy, defaultRoleId } = req.body;

        if (!name || !createdBy) {
            return res.status(400).json({
                success: false,
                message: "Project name and createdBy (User/Admin ID) are required"
            });
        }

        const joinCode = generateJoinCode();

        const project = await Project.create({
            name,
            description: description || "",
            joinCode,
            defaultRoleId: defaultRoleId || null,
            createdBy,
            status: "active"
        });

        // Add creator/admin as project member with full permissions
        await ProjectMember.create({
            projectId: project._id,
            userId: createdBy,
            permissions: ["create", "read", "update", "delete"]
        });

        res.status(201).json({
            success: true,
            message: "Project created successfully",
            data: project
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to create project",
            error: error.message
        });
    }
};

// 2. Add or Invite User to Project (Supports single project or multi-project array format)
const addOrInviteUserToProject = async (req, res) => {
    try {
        const { email, projectId, permissions, projects } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Email is required"
            });
        }

        let projectList = [];
        if (Array.isArray(projects) && projects.length > 0) {
            projectList = projects;
        } else if (projectId) {
            projectList = [{ projectId, permissions }];
        }

        if (projectList.length === 0) {
            return res.status(400).json({
                success: false,
                message: "At least one project with projectId must be provided"
            });
        }

        const userEmailClean = email.toLowerCase().trim();
        const existingUser = await User.findOne({ email: userEmailClean });

        let processedCount = 0;

        for (const item of projectList) {
            const pId = item.projectId;
            if (!pId) continue;

            const userPermissions = Array.isArray(item.permissions) && item.permissions.length > 0
                ? item.permissions
                : ["read"];

            const project = await Project.findById(pId);
            if (!project) continue;

            if (existingUser) {
                // Add or update entry in ProjectMember for each project with specified permissions
                await ProjectMember.findOneAndUpdate(
                    { projectId: pId, userId: existingUser._id },
                    { permissions: userPermissions },
                    { upsert: true, new: true }
                );
            } else {
                // Create or update entry in Invitation for each project
                await Invitation.findOneAndUpdate(
                    { email: userEmailClean, projectId: pId },
                    {
                        joinCode: project.joinCode,
                        permissions: userPermissions,
                        status: "pending"
                    },
                    { upsert: true, new: true }
                );
            }
            processedCount++;
        }

        return res.status(200).json({
            success: true,
            message: `User invited to ${processedCount} project(s) successfully`
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to add/invite user to project",
            error: error.message
        });
    }
};

// 3. Update Member Permissions in a Project
const updateMemberPermissions = async (req, res) => {
    try {
        const { projectId, userId, permissions } = req.body;

        if (!projectId || !userId || !Array.isArray(permissions)) {
            return res.status(400).json({
                success: false,
                message: "projectId, userId, and permissions array are required"
            });
        }

        const member = await ProjectMember.findOne({ projectId, userId });

        if (!member) {
            return res.status(404).json({
                success: false,
                message: "Project member not found"
            });
        }

        member.permissions = permissions;
        await member.save();

        res.status(200).json({
            success: true,
            message: "Member permissions updated successfully",
            data: member
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to update member permissions",
            error: error.message
        });
    }
};

// 4. Get Project Members with Permissions (Paginated)
const getProjectMembers = async (req, res) => {
    try {
        const { projectId } = req.params;
        const { page, limit, skip } = getPaginationParams(req.query);

        const filter = { projectId };
        const total = await ProjectMember.countDocuments(filter);

        const members = await ProjectMember.find(filter)
            .populate("userId", "name email mobile isActive")
            .populate("projectId", "name joinCode")
            .skip(skip)
            .limit(limit);

        res.status(200).json({
            success: true,
            ...formatPaginatedResponse({ data: members, total, page, limit })
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch project members",
            error: error.message
        });
    }
};

// 5. Get All Projects (Paginated)
const getAllProjects = async (req, res) => {
    try {
        const { page, limit, skip } = getPaginationParams(req.query);

        const total = await Project.countDocuments();
        const projects = await Project.find()
            .populate("createdBy", "name email")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        res.status(200).json({
            success: true,
            ...formatPaginatedResponse({ data: projects, total, page, limit })
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch projects",
            error: error.message
        });
    }
};

// 6. Delete Project
const deleteProject = async (req, res) => {
    try {
        const { projectId } = req.params;
        const mongoose = require("mongoose");

        if (!projectId || !mongoose.Types.ObjectId.isValid(projectId)) {
            return res.status(404).json({
                success: false,
                message: "Project not found or invalid ID"
            });
        }

        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({
                success: false,
                message: "Project not found"
            });
        }

        // 1. Delete associated files documents & disk files
        try {
            const files = await File.find({ projectId });
            for (const file of files) {
                if (file.path && fs.existsSync(file.path)) {
                    try { fs.unlinkSync(file.path); } catch (e) {}
                }
            }
            await File.deleteMany({ projectId });
        } catch (fileErr) {
            console.warn("Could not delete project files:", fileErr.message);
        }

        // 2. Delete associated project members
        await ProjectMember.deleteMany({ projectId });

        // 3. Delete associated invitations
        await Invitation.deleteMany({ projectId });

        // 4. Delete the project itself
        await Project.findByIdAndDelete(projectId);

        // 5. Create audit log
        try {
            const adminId = req.headers.authorization ? req.headers.authorization.replace("Bearer ", "") : null;
            await createAuditLog({
                userId: adminId,
                projectId: null,
                action: "PROJECT_DELETE",
                entityType: "Project",
                entityId: projectId,
                details: { projectName: project.name }
            });
        } catch (auditErr) {}

        res.status(200).json({
            success: true,
            message: `Project "${project.name}" deleted successfully from database`
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to delete project",
            error: error.message
        });
    }
};

// 7. Update Project Details (Name, Description, Status)
const updateProject = async (req, res) => {
    try {
        const { projectId } = req.params;
        const { name, title, description, status, userId } = req.body;
        const mongoose = require("mongoose");

        if (!projectId || !mongoose.Types.ObjectId.isValid(projectId)) {
            return res.status(404).json({
                success: false,
                message: "Project not found or invalid ID"
            });
        }

        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({
                success: false,
                message: "Project not found"
            });
        }

        const newName = name || title;
        if (newName !== undefined && newName.trim() !== "") {
            project.name = newName.trim();
        }
        if (description !== undefined) {
            project.description = description.trim();
        }
        if (status !== undefined && status.trim() !== "") {
            project.status = status.trim();
        }

        await project.save();

        const performingUserId = userId || req.headers?.userid || req.user?.id;
        if (performingUserId) {
            await createAuditLog({
                userId: performingUserId,
                projectId: project._id,
                action: "UPDATE_PROJECT",
                entityType: "Project",
                entityId: project._id,
                details: {
                    updatedName: project.name,
                    updatedDescription: project.description,
                    updatedStatus: project.status
                }
            });
        }

        res.status(200).json({
            success: true,
            message: "Project details updated successfully",
            data: project
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to update project details",
            error: error.message
        });
    }
};

// 8. Get Single Project By ID
const getProjectById = async (req, res) => {
    try {
        const { projectId } = req.params;
        const mongoose = require("mongoose");

        if (!projectId || !mongoose.Types.ObjectId.isValid(projectId)) {
            return res.status(404).json({
                success: false,
                message: "Project not found or invalid ID"
            });
        }

        const project = await Project.findById(projectId).populate("createdBy", "name email");
        if (!project) {
            return res.status(404).json({
                success: false,
                message: "Project not found"
            });
        }

        res.status(200).json({
            success: true,
            data: project
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch project",
            error: error.message
        });
    }
};

module.exports = {
    createProject,
    addOrInviteUserToProject,
    updateMemberPermissions,
    getProjectMembers,
    getAllProjects,
    deleteProject,
    updateProject,
    getProjectById
};