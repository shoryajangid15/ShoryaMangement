const mongoose = require("mongoose");

const roleSchema = new mongoose.Schema({

    name: {
        type: mongoose.Schema.Types.String,
        required: true,
        unique: true
    },

    permissions: {
        type: [mongoose.Schema.Types.String],
        required: true
    }

}, {
    timestamps: true
});

module.exports = mongoose.model("Role", roleSchema);