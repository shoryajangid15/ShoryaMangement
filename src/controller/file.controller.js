const File = require("../models/file.models");
const ShareLink = require("../models/shareLink.models");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const createAuditLog = require("../utils/createAuditLog");
const { getPaginationParams, formatPaginatedResponse } = require("../utils/paginate");

// 1. Upload File
const uploadFile = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "No file uploaded"
            });
        }

        const { projectId, uploadedBy, externalUrl, folderId } = req.body;

        if (!projectId || !uploadedBy) {
            // Remove uploaded file if validation fails
            fs.unlinkSync(req.file.path);
            return res.status(400).json({
                success: false,
                message: "projectId and uploadedBy are required"
            });
        }

        const fileUrl = `/uploads/${req.file.filename}`;

        const newFile = await File.create({
            projectId,
            uploadedBy,
            filename: req.file.filename,
            originalName: req.file.originalname,
            path: req.file.path,
            fileUrl,
            mimeType: req.file.mimetype,
            size: req.file.size,
            externalUrl: externalUrl || null,
            folderId: folderId || null
        });

        // Create Audit Log entry for file upload
        await createAuditLog({
            userId: uploadedBy,
            projectId,
            action: "UPLOAD_FILE",
            entityType: "File",
            entityId: newFile._id,
            details: {
                fileName: newFile.originalName,
                fileSize: newFile.size,
                mimeType: newFile.mimeType
            }
        });

        res.status(201).json({
            success: true,
            message: "File uploaded successfully",
            data: newFile
        });
    } catch (error) {
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({
            success: false,
            message: "File upload failed",
            error: error.message
        });
    }
};

// 2. Get All Files of a Project (Paginated)
const getProjectFiles = async (req, res) => {
    try {
        const { projectId } = req.params;
        const { page, limit, skip } = getPaginationParams(req.query);

        const filter = { projectId };
        const total = await File.countDocuments(filter);

        const files = await File.find(filter)
            .populate("uploadedBy", "name email")
            .populate("projectId", "name")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        res.status(200).json({
            success: true,
            ...formatPaginatedResponse({ data: files, total, page, limit })
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch project files",
            error: error.message
        });
    }
};

// 3. Delete File (From DB & Disk)
const deleteFile = async (req, res) => {
    try {
        const { fileId } = req.params;
        const userId = req.user?.id || req.body?.userId || req.query?.userId || req.headers?.userid;

        const file = await File.findById(fileId);
        if (!file) {
            return res.status(404).json({
                success: false,
                message: "File not found"
            });
        }

        // Delete from local disk if file exists
        if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
        }

        await File.findByIdAndDelete(fileId);

        // Create Audit Log entry for file deletion
        if (userId) {
            await createAuditLog({
                userId,
                projectId: file.projectId,
                action: "DELETE_FILE",
                entityType: "File",
                entityId: file._id,
                details: {
                    fileName: file.originalName
                }
            });
        }

        res.status(200).json({
            success: true,
            message: "File deleted successfully"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to delete file",
            error: error.message
        });
    }
};

// 4. Rename File (Updates originalName in DB)
const renameFile = async (req, res) => {
    try {
        const { fileId } = req.params;
        const newName = req.body.originalName || req.body.newName || req.body.name;
        const userId = req.user?.id || req.body?.userId || req.query?.userId || req.headers?.userid;

        if (!newName || !newName.trim()) {
            return res.status(400).json({
                success: false,
                message: "New file name is required"
            });
        }

        const file = await File.findById(fileId);
        if (!file) {
            return res.status(404).json({
                success: false,
                message: "File not found"
            });
        }

        const oldName = file.originalName;
        file.originalName = newName.trim();
        await file.save();

        // Create Audit Log entry for file rename
        if (userId) {
            await createAuditLog({
                userId,
                projectId: file.projectId,
                action: "RENAME_FILE",
                entityType: "File",
                entityId: file._id,
                details: {
                    oldName,
                    newName: file.originalName
                }
            });
        }

        res.status(200).json({
            success: true,
            message: "File renamed successfully",
            data: file
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to rename file",
            error: error.message
        });
    }
};

// 5. Generate Share Link for File
const generateShareLink = async (req, res) => {
    try {
        const { fileId, expiresInHours, isOneTime, userId } = req.body;

        if (!fileId) {
            return res.status(400).json({
                success: false,
                message: "fileId is required"
            });
        }

        const file = await File.findById(fileId);
        if (!file) {
            return res.status(404).json({
                success: false,
                message: "File not found"
            });
        }

        const token = crypto.randomBytes(16).toString("hex");

        let expiresAt = null;
        if (expiresInHours && !isNaN(expiresInHours)) {
            expiresAt = new Date(Date.now() + parseFloat(expiresInHours) * 3600000);
        }

        const shareLink = await ShareLink.create({
            fileId,
            token,
            expiresAt,
            isOneTime: Boolean(isOneTime),
            createdBy: userId || null
        });

        res.status(201).json({
            success: true,
            message: "Share link generated successfully",
            data: {
                token: shareLink.token,
                shareUrl: `/api/files/shared/${shareLink.token}`,
                expiresAt: shareLink.expiresAt,
                isOneTime: shareLink.isOneTime
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to generate share link",
            error: error.message
        });
    }
};

// 6. Access / Consume Shared File by Token
const getSharedFile = async (req, res) => {
    try {
        const { token } = req.params;

        const shareLink = await ShareLink.findOne({ token }).populate("fileId");
        if (!shareLink) {
            return res.status(404).json({
                success: false,
                message: "Share link not found or invalid"
            });
        }

        if (shareLink.expiresAt && new Date() > new Date(shareLink.expiresAt)) {
            return res.status(410).json({
                success: false,
                message: "This share link has expired"
            });
        }

        if (shareLink.isOneTime && shareLink.isUsed) {
            return res.status(410).json({
                success: false,
                message: "This one-time link has already been used"
            });
        }

        const file = shareLink.fileId;
        if (!file) {
            return res.status(404).json({
                success: false,
                message: "Associated file no longer exists"
            });
        }

        if (shareLink.isOneTime) {
            shareLink.isUsed = true;
        }
        shareLink.accessCount += 1;
        await shareLink.save();

        res.status(200).json({
            success: true,
            data: {
                fileName: file.originalName,
                size: file.size,
                mimeType: file.mimeType,
                fileUrl: file.fileUrl,
                externalUrl: file.externalUrl || null
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to access shared file",
            error: error.message
        });
    }
};

module.exports = {
    uploadFile,
    getProjectFiles,
    deleteFile,
    renameFile,
    generateShareLink,
    getSharedFile
};

