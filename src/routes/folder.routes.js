const express = require("express");
const router = express.Router();
const {
    createFolder,
    getProjectFolders,
    deleteFolder
} = require("../controller/folder.controller");

// Create Folder / Subfolder
router.post("/", createFolder);

// List Folders for a Project (by parentFolderId query param)
router.get("/project/:projectId", getProjectFolders);

// Delete Folder (Recursively deletes subfolders & files)
router.delete("/:folderId", deleteFolder);

module.exports = router;
