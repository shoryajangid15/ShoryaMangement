const mongoose = require("mongoose");

const shareLinkSchema = new mongoose.Schema({
    fileId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "File",
        required: true
    },
    token: {
        type: String,
        required: true,
        unique: true
    },
    expiresAt: {
        type: Date,
        default: null
    },
    isOneTime: {
        type: Boolean,
        default: false
    },
    isUsed: {
        type: Boolean,
        default: false
    },
    accessCount: {
        type: Number,
        default: 0
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null
    }
}, {
    timestamps: true
});

module.exports = mongoose.model("ShareLink", shareLinkSchema);
