const express = require("express");
const router = express.Router();

const {
    createProject,
    addOrInviteUserToProject,
    updateMemberPermissions,
    getProjectMembers,
    getAllProjects
} = require("../controller/projects.controller");

router.post("/create", createProject);
router.post("/invite-user", addOrInviteUserToProject);
router.put("/update-permissions", updateMemberPermissions);
router.get("/:projectId/members", getProjectMembers);
router.get("/", getAllProjects);

module.exports = router;
