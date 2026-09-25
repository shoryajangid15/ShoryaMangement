const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const adminRoutes = require("./routes/admin.routes");
const projectRoutes = require("./routes/projects.routes");
const userRoutes = require("./routes/users.routes");
const seedDefaultAdmin = require("./utils/seedAdmin");

const app = express();

app.use(cors());
app.use(express.json());

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/Firstselfdb";

mongoose.connect(MONGO_URI)
    .then(async () => {
        console.log("MongoDB Connected");
        await seedDefaultAdmin();
    })
    .catch((error) => {
        console.log("MongoDB Connection Error:", error);
    });

app.get("/", (req, res) => {
    res.send("KasperTechWork Server is Running");
});

app.use("/api/admin", adminRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/users", userRoutes);

module.exports = app;