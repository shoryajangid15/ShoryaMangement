const bcrypt = require("bcryptjs");
const Admin = require("../models/admin.models");

const loginAdmin = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required"
            });
        }

        const admin = await Admin.findOne({ email });

        if (!admin) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        // Compare password using bcrypt
        const isMatch = await bcrypt.compare(password, admin.passwordHash);

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        if (!admin.isActive) {
            return res.status(403).json({
                success: false,
                message: "Admin account is inactive"
            });
        }

        res.status(200).json({
            success: true,
            message: "Admin login successful",
            data: {
                id: admin._id,
                email: admin.email
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

const registerAdmin = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required"
            });
        }

        const existingAdmin = await Admin.findOne({ email });

        if (existingAdmin) {
            return res.status(400).json({
                success: false,
                message: "Admin with this email already exists"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newAdmin = await Admin.create({
            email,
            passwordHash: hashedPassword,
            isActive: true
        });

        res.status(201).json({
            success: true,
            message: "Admin registered successfully",
            data: {
                id: newAdmin._id,
                email: newAdmin.email,
                isActive: newAdmin.isActive
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Admin registration failed",
            error: error.message
        });
    }
};

module.exports = {
    loginAdmin,
    registerAdmin
};

