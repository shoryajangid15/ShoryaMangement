const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload.middleware");
const checkPermission = require("../middleware/checkPermission");
const { uploadFile, getProjectFiles, deleteFile } = require("../controller/file.controller");

// Upload File (Permission: 'create')
router.post("/upload", checkPermission("create"), upload.single("file"), uploadFile);

// Get Project Files (Permission: 'read')
router.get("/project/:projectId", checkPermission("read"), getProjectFiles);

// Delete File (Permission: 'delete')
router.delete("/:fileId", checkPermission("delete"), deleteFile);

module.exports = router;
