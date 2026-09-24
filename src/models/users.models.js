const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({

    name: {
        type: mongoose.Schema.Types.String,
        required: true
    },

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

    mobile: {
        type: mongoose.Schema.Types.Number,
        required: true
    }

},
    {
    timestamps: true
});

module.exports = mongoose.model("User", userSchema);