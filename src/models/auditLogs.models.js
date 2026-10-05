const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    adminId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Admin"
    },
    userType: {
        type: String,
        enum: ["User", "Admin"],
        default: "User"
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
        default: "System"
    },
    entityId: {
        type: mongoose.Schema.Types.Mixed
    },
    details: {
        type: mongoose.Schema.Types.Mixed
    }
}, {
    timestamps: true
});

module.exports = mongoose.model("AuditLog", auditLogSchema);
