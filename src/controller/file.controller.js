const File = require("../models/file.models");
const fs = require("fs");
const path = require("path");
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

        const { projectId, uploadedBy } = req.body;

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
            size: req.file.size
        });

        // 📝 Create Audit Log entry for file upload
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

        // 📝 Create Audit Log entry for file deletion
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

module.exports = {
    uploadFile,
    getProjectFiles,
    deleteFile
};
