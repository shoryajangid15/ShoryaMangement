const express = require("express");
const router = express.Router();

const {
    registerUser,
    loginUser,
    deleteUser,
    getAllUsers,
    getUserById,
    sendOtp,
    verifyOtp
} = require("../controller/users.controller");

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp);
router.get("/", getAllUsers);
router.get("/:id", getUserById);
router.delete("/:id", deleteUser);

module.exports = router;

