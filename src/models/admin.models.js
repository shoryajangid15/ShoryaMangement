const mongoose = require("mongoose");

const AdminSchema = new mongoose.Schema({
    email: {
        type: mongoose.Schema.Types.String,
        required: true,
        unique: true
    },

    passwordHash: {
        type: mongoose.Schema.Types.String,
        required: true
    },

    isActive: {
        type: mongoose.Schema.Types.Boolean,
        default: true
    },

},
    {
    timestamps: true
});

module.exports = mongoose.model("Admin", AdminSchema);
