const mongoose = require("mongoose");

const folderSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Project",
        required: true
    },
    parentFolderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Folder",
        default: null
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null
    }
}, {
    timestamps: true
});

module.exports = mongoose.model("Folder", folderSchema);
