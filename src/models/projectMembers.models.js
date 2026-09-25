const mongoose = require("mongoose");

const projectMemberSchema = new mongoose.Schema({

    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Project",
        required: true
    },

    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    roleId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Role",
        required: false
    },

    permissions: {
        type: [mongoose.Schema.Types.String],
        default: ["read"]
    },

    joinedAt: {
        type: mongoose.Schema.Types.Date,
        default: Date.now
    }

}, {
    timestamps: true
});

projectMemberSchema.index(
    { projectId: 1, userId: 1 },
    { unique: true }
);

module.exports = mongoose.model("ProjectMember", projectMemberSchema);