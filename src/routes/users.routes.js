const express = require("express");
const router = express.Router();

const {
    registerUser,
    loginUser,
    deleteUser,
    getAllUsers,
    getUserById,
    sendOtp,
    verifyOtp,
    sendInviteEmail
} = require("../controller/users.controller");

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp);
router.post("/send-invite-email", sendInviteEmail);
router.get("/", getAllUsers);
router.get("/:id", getUserById);
router.delete("/:id", deleteUser);

module.exports = router;

