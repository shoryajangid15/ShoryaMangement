const mongoose = require("mongoose");

const fileSchema = new mongoose.Schema({
    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Project",
        required: true
    },
    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    filename: {
        type: mongoose.Schema.Types.String,
        required: true
    },
    originalName: {
        type: mongoose.Schema.Types.String,
        required: true
    },
    path: {
        type: mongoose.Schema.Types.String,
        required: true
    },
    fileUrl: {
        type: mongoose.Schema.Types.String,
        required: true
    },
    mimeType: {
        type: mongoose.Schema.Types.String
    },
    size: {
        type: mongoose.Schema.Types.Number
    }
}, {
    timestamps: true
});

module.exports = mongoose.model("File", fileSchema);
