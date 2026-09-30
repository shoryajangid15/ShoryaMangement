const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload.middleware");
const checkPermission = require("../middleware/checkPermission");
const {
    uploadFile,
    getProjectFiles,
    deleteFile,
    renameFile,
    generateShareLink,
    getSharedFile
} = require("../controller/file.controller");

// Upload File (Permission: 'create')
router.post("/upload", upload.single("file"), checkPermission("create"), uploadFile);

// Share Link Routes
router.post("/share-link", generateShareLink);
router.get("/shared/:token", getSharedFile);

// Get Project Files (Permission: 'read')
router.get("/project/:projectId", checkPermission("read"), getProjectFiles);

// Rename File (Permission: 'update')
router.put("/:fileId", checkPermission("update"), renameFile);
router.put("/rename/:fileId", checkPermission("update"), renameFile);

// Delete File (Permission: 'delete')
router.delete("/:fileId", checkPermission("delete"), deleteFile);

module.exports = router;

