const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema({

    name: {
        type: mongoose.Schema.Types.String,
        required: true
    },

    description: {
        type: mongoose.Schema.Types.String,
        required: false
    },

    status: {
        type: mongoose.Schema.Types.String,
        default: "active"
    },

    joinCode: {
        type: mongoose.Schema.Types.String,
        required: true,
        unique: true
    },

    defaultRoleId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Role",
        required: false
    },

    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    }

}, {
    timestamps: true
});

module.exports = mongoose.model("Project", projectSchema);