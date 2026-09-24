const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema({

    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },

    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Project"
    },

    action: {
        type: mongoose.Schema.Types.String,
        required: true
    },

    entityType: {
        type: mongoose.Schema.Types.String,
        enum: ["Project", "Material", "Role", "User", "ProjectMember"],
        required: true,

    },

    entityId: {
        type: mongoose.Schema.Types.ObjectId
    }

    }, 
    {
        timestamps: true
});

module.exports = mongoose.model("AuditLog", auditLogSchema);