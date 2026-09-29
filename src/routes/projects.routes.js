const express = require("express");
const router = express.Router();

const {
    createProject,
    addOrInviteUserToProject,
    updateMemberPermissions,
    getProjectMembers,
    getAllProjects,
    getProjectById,
    updateProject,
    deleteProject
} = require("../controller/projects.controller");

router.post("/create", createProject);
router.post("/invite-user", addOrInviteUserToProject);
router.put("/update-permissions", updateMemberPermissions);
router.get("/:projectId/members", getProjectMembers);
router.get("/", getAllProjects);
router.get("/:projectId", getProjectById);
router.put("/:projectId", updateProject);
router.delete("/:projectId", deleteProject);

module.exports = router;

