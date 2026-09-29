const express = require("express");
const router = express.Router();

const {
    registerUser,
    loginUser,
    deleteUser,
    getAllUsers,
    getUserById
} = require("../controller/users.controller");

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/", getAllUsers);
router.get("/:id", getUserById);
router.delete("/:id", deleteUser);

module.exports = router;

