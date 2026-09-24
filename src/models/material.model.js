const mongoose = require("mongoose");

const materialSchema = new mongoose.Schema({

    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Project",
        required: true
    },

    name: {
        type: mongoose.Schema.Types.String,
        required: true
    },

    type: {
        type: mongoose.Schema.Types.String,
        enum: ["image", "video", "document", "other"],
        required: true
    },

    filePath: {
        type: mongoose.Schema.Types.String,
        required: true
    },

    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    }

}, {
    timestamps: true
});

module.exports = mongoose.model("Material", materialSchema);