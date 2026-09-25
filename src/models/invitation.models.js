const mongoose = require("mongoose");

const invitationSchema = new mongoose.Schema({
    email: {
        type: mongoose.Schema.Types.String,
        required: true,
        lowercase: true,
        trim: true
    },
    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Project",
        required: true
    },
    joinCode: {
        type: mongoose.Schema.Types.String,
        required: true
    },
    permissions: {
        type: [mongoose.Schema.Types.String],
        default: ["read"]
    },
    status: {
        type: mongoose.Schema.Types.String,
        enum: ["pending", "accepted", "expired"],
        default: "pending"
    }
}, {
    timestamps: true
});

invitationSchema.index({ email: 1, projectId: 1 }, { unique: true });

module.exports = mongoose.model("Invitation", invitationSchema);
