const bcrypt = require("bcryptjs");
const User = require("../models/users.models");
const Invitation = require("../models/invitation.models");
const ProjectMember = require("../models/projectMembers.models");

// 1. Register User (Checks for Pending Project Invites)
const registerUser = async (req, res) => {
    try {
        const { name, email, password, mobile } = req.body;

        if (!name || !email || !password || !mobile) {
            return res.status(400).json({
                success: false,
                message: "Name, email, password, and mobile are required"
            });
        }

        const userEmailClean = email.toLowerCase().trim();

        const existingUser = await User.findOne({ email: userEmailClean });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "User with this email already exists"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await User.create({
            name,
            email: userEmailClean,
            passwordHash: hashedPassword,
            mobile,
            isActive: true
        });

        // Check for any pending invitations for this email
        const pendingInvites = await Invitation.find({
            email: userEmailClean,
            status: "pending"
        });

        let joinedProjectsCount = 0;

        for (const invite of pendingInvites) {
            await ProjectMember.create({
                projectId: invite.projectId,
                userId: newUser._id,
                permissions: invite.permissions
            });

            invite.status = "accepted";
            await invite.save();
            joinedProjectsCount++;
        }

        res.status(201).json({
            success: true,
            message: `User registered successfully. ${joinedProjectsCount > 0 ? `Auto-joined ${joinedProjectsCount} invited project(s)!` : ""}`,
            data: {
                id: newUser._id,
                name: newUser.name,
                email: newUser.email,
                mobile: newUser.mobile,
                joinedProjectsCount
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "User registration failed",
            error: error.message
        });
    }
};

// 2. User Login
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required"
            });
        }

        const userEmailClean = email.toLowerCase().trim();
        const user = await User.findOne({ email: userEmailClean });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        if (!user.isActive) {
            return res.status(403).json({
                success: false,
                message: "User account is inactive"
            });
        }

        // Fetch user's projects with permissions
        const userProjects = await ProjectMember.find({ userId: user._id })
            .populate("projectId", "name description joinCode status");

        res.status(200).json({
            success: true,
            message: "User login successful",
            data: {
                id: user._id,
                name: user.name,
                email: user.email,
                projects: userProjects
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Login failed",
            error: error.message
        });
    }
};

module.exports = {
    registerUser,
    loginUser
};
