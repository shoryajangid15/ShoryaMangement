const Folder = require("../models/folder.models");
const File = require("../models/file.models");
const fs = require("fs");

// 1. Create Folder or Subfolder
const createFolder = async (req, res) => {
    try {
        const { name, projectId, parentFolderId, userId, createdBy } = req.body;

        if (!name || !projectId) {
            return res.status(400).json({
                success: false,
                message: "Folder name and projectId are required"
            });
        }

        let parentId = null;
        if (parentFolderId && parentFolderId !== "null" && parentFolderId !== "undefined") {
            parentId = parentFolderId;
            const parentFolder = await Folder.findById(parentId);
            if (!parentFolder) {
                return res.status(404).json({
                    success: false,
                    message: "Parent folder not found"
                });
            }
        }

        const folder = await Folder.create({
            name: name.trim(),
            projectId,
            parentFolderId: parentId,
            createdBy: userId || createdBy || null
        });

        res.status(201).json({
            success: true,
            message: "Folder created successfully",
            data: folder
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to create folder",
            error: error.message
        });
    }
};

// 2. List Folders for a Project (by Parent)
const getProjectFolders = async (req, res) => {
    try {
        const { projectId } = req.params;
        const { parentFolderId } = req.query;

        let parentFilter = null;
        if (parentFolderId && parentFolderId !== "null" && parentFolderId !== "undefined") {
            parentFilter = parentFolderId;
        }

        const filter = {
            projectId,
            parentFolderId: parentFilter
        };

        const folders = await Folder.find(filter)
            .populate("createdBy", "name email")
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data: folders
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch project folders",
            error: error.message
        });
    }
};

// Helper function to recursively collect all child subfolder IDs
const getAllSubfolderIds = async (parentIds) => {
    if (!parentIds || parentIds.length === 0) return [];
    const children = await Folder.find({ parentFolderId: { $in: parentIds } }).select("_id");
    if (children.length === 0) return [];
    const childIds = children.map(c => c._id);
    const descendantIds = await getAllSubfolderIds(childIds);
    return [...childIds, ...descendantIds];
};

// 3. Delete Folder (Recursive deletion of folder, subfolders, and files)
const deleteFolder = async (req, res) => {
    try {
        const { folderId } = req.params;

        const targetFolder = await Folder.findById(folderId);
        if (!targetFolder) {
            return res.status(404).json({
                success: false,
                message: "Folder not found"
            });
        }

        // Gather target folder ID and all its recursive child subfolder IDs
        const descendantFolderIds = await getAllSubfolderIds([folderId]);
        const allFolderIds = [folderId, ...descendantFolderIds];

        // Find all files inside these folders to remove them from disk
        const filesToDelete = await File.find({ folderId: { $in: allFolderIds } });
        for (const file of filesToDelete) {
            if (file.path && fs.existsSync(file.path)) {
                try {
                    fs.unlinkSync(file.path);
                } catch (err) {
                    console.error("Error unlinking file during folder delete:", err.message);
                }
            }
        }

        // Delete all files in these folders from DB
        await File.deleteMany({ folderId: { $in: allFolderIds } });

        // Delete all folders from DB
        await Folder.deleteMany({ _id: { $in: allFolderIds } });

        res.status(200).json({
            success: true,
            message: "Folder, child subfolders, and all associated files deleted successfully"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to delete folder",
            error: error.message
        });
    }
};

module.exports = {
    createFolder,
    getProjectFolders,
    deleteFolder
};
