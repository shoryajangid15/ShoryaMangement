const Project = require("../models/projects.models");
const ProjectMember = require("../models/projectMembers.models");
const User = require("../models/users.models");
const Invitation = require("../models/invitation.models");
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

// 2. Add or Invite User to Project (Direct add if exists, else Invitation)
const addOrInviteUserToProject = async (req, res) => {
    try {
        const { projectId, email, permissions } = req.body;

        if (!projectId || !email) {
            return res.status(400).json({
                success: false,
                message: "ProjectId and user email are required"
            });
        }

        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({
                success: false,
                message: "Project not found"
            });
        }

        const userPermissions = Array.isArray(permissions) && permissions.length > 0
            ? permissions
            : ["read"];

        const userEmailClean = email.toLowerCase().trim();
        const existingUser = await User.findOne({ email: userEmailClean });

        if (existingUser) {
            // Check if already a member of this project
            const alreadyMember = await ProjectMember.findOne({
                projectId,
                userId: existingUser._id
            });

            if (alreadyMember) {
                return res.status(400).json({
                    success: false,
                    message: "User is already a member of this project"
                });
            }

            // Direct Add existing user to ProjectMember table with specific permissions
            const newMember = await ProjectMember.create({
                projectId,
                userId: existingUser._id,
                permissions: userPermissions
            });

            return res.status(200).json({
                success: true,
                message: "Existing user added directly to the project",
                isDirectAdd: true,
                data: newMember
            });
        } else {
            // User not registered yet -> Create or Update Invitation
            const invitation = await Invitation.findOneAndUpdate(
                { email: userEmailClean, projectId },
                {
                    joinCode: project.joinCode,
                    permissions: userPermissions,
                    status: "pending"
                },
                { upsert: true, new: true }
            );

            return res.status(200).json({
                success: true,
                message: "Invitation saved. User will be added upon registration.",
                isDirectAdd: false,
                data: invitation
            });
        }

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

module.exports = {
    createProject,
    addOrInviteUserToProject,
    updateMemberPermissions,
    getProjectMembers,
    getAllProjects
};
