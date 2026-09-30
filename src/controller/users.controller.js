const bcrypt = require("bcryptjs");
const User = require("../models/users.models");
const Invitation = require("../models/invitation.models");
const ProjectMember = require("../models/projectMembers.models");
const createAuditLog = require("../utils/createAuditLog");
const sendEmail = require("../utils/sendEmail");
const { getPaginationParams, formatPaginatedResponse } = require("../utils/paginate");


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

// 3. Delete User
const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        const performingUserId = req.body.performingUserId || req.query.performingUserId;

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // Remove user's project memberships
        await ProjectMember.deleteMany({ userId: id });

        // Remove user's pending invitations if any
        await Invitation.deleteMany({ email: user.email });

        // Delete user
        await User.findByIdAndDelete(id);

        if (performingUserId) {
            await createAuditLog({
                userId: performingUserId,
                action: "delete_user",
                entityType: "User",
                entityId: id,
                details: { deletedUserEmail: user.email, deletedUserName: user.name }
            });
        }

        res.status(200).json({
            success: true,
            message: "User deleted successfully",
            data: { id, email: user.email, name: user.name }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to delete user",
            error: error.message
        });
    }
};

// 4. Get All Users (Paginated)
const getAllUsers = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        // Increase default limit to 500 so all users load consistently
        const limit = parseInt(req.query.limit) || 500;
        const skip = (page - 1) * limit;

        const total = await User.countDocuments();
        const users = await User.find()
            .select("-passwordHash")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        res.status(200).json({
            success: true,
            data: users,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch users",
            error: error.message
        });
    }
};

// 5. Get User By ID
const getUserById = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findById(id).select("-passwordHash");
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }
        res.status(200).json({
            success: true,
            data: user
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch user",
            error: error.message
        });
    }
};

// 6. Send Verification OTP
const sendOtp = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Email is required"
            });
        }

        const userEmailClean = email.toLowerCase().trim();

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        // 10 minutes expiry
        const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

        const user = await User.findOne({ email: userEmailClean });
        if (user) {
            user.otp = otp;
            user.otpExpiresAt = otpExpiresAt;
            await user.save();
        }

        // Send OTP HTML Email
        try {
            await sendEmail({
                to: userEmailClean,
                subject: "Your Email Verification OTP - KasperTech DMS",
                text: `Your OTP for verification is ${otp}. It will expire in 10 minutes.`,
                html: `
                    <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 500px; border: 1px solid #e0e0e0; border-radius: 8px;">
                        <h2 style="color: #333;">Email Verification</h2>
                        <p style="color: #555;">Use the following OTP to verify your email address:</p>
                        <div style="background: #f4f4f7; padding: 15px; text-align: center; border-radius: 6px; font-size: 28px; font-weight: bold; letter-spacing: 6px; color: #4F46E5;">
                            ${otp}
                        </div>
                        <p style="color: #888; font-size: 12px; margin-top: 15px;">This OTP is valid for 10 minutes. If you did not request this, please ignore this email.</p>
                    </div>
                `
            });
        } catch (emailErr) {
            console.error("Nodemailer Email Error:", emailErr.message);
        }

        res.status(200).json({
            success: true,
            message: "Verification OTP sent to your email"
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to send OTP",
            error: error.message
        });
    }
};

// 7. Verify OTP
const verifyOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({
                success: false,
                message: "Email and OTP are required"
            });
        }

        const userEmailClean = email.toLowerCase().trim();
        const user = await User.findOne({ email: userEmailClean });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        if (!user.otp || user.otp !== otp.toString().trim()) {
            return res.status(400).json({
                success: false,
                message: "Invalid OTP"
            });
        }

        if (new Date() > new Date(user.otpExpiresAt)) {
            return res.status(400).json({
                success: false,
                message: "OTP has expired"
            });
        }

        user.isEmailVerified = true;
        user.otp = null;
        user.otpExpiresAt = null;
        await user.save();

        res.status(200).json({
            success: true,
            message: "Email verified successfully"
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to verify OTP",
            error: error.message
        });
    }
};

// 8. Send Joining Invitation Email
const sendInviteEmail = async (req, res) => {
    try {
        const { email, inviteLink, projectName } = req.body;

        if (!email || !inviteLink) {
            return res.status(400).json({
                success: false,
                message: "Email and inviteLink are required"
            });
        }

        const userEmailClean = email.toLowerCase().trim();
        const pName = projectName || "Project Workspace";

        try {
            await sendEmail({
                to: userEmailClean,
                subject: `Invitation to join ${pName} - KasperTech DMS`,
                text: `You have been invited to join ${pName}. Click the link to register and access: ${inviteLink}`,
                html: `
                    <div style="font-family: Arial, sans-serif; padding: 25px; max-width: 550px; border: 1px solid #e2e8f0; border-radius: 10px; background-color: #ffffff;">
                        <h2 style="color: #1e293b; margin-top: 0;">Project Invitation</h2>
                        <p style="color: #475569; font-size: 15px; line-height: 1.5;">
                            You have been invited to join the <strong>${pName}</strong> project workspace on KasperTech DMS.
                        </p>
                        <div style="margin: 25px 0; text-align: center;">
                            <a href="${inviteLink}" style="background-color: #4f46e5; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 15px;">
                                Join Project Workspace
                            </a>
                        </div>
                        <p style="color: #64748b; font-size: 13px;">
                            If the button above does not work, copy and paste this link into your browser:<br/>
                            <a href="${inviteLink}" style="color: #4f46e5; word-break: break-all;">${inviteLink}</a>
                        </p>
                        <hr style="border: none; border-top: 1px solid #f1f5f9; margin-top: 25px;" />
                        <p style="color: #94a3b8; font-size: 12px; margin-bottom: 0;">
                            KasperTech Document Management System
                        </p>
                    </div>
                `
            });
        } catch (emailErr) {
            console.error("Nodemailer Email Error:", emailErr.message);
        }

        res.status(200).json({
            success: true,
            message: "Joining link sent to user email successfully"
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to send invitation email",
            error: error.message
        });
    }
};

module.exports = {
    registerUser,
    loginUser,
    deleteUser,
    getAllUsers,
    getUserById,
    sendOtp,
    verifyOtp,
    sendInviteEmail
};

