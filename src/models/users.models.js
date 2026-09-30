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
    },

    isEmailVerified: {
        type: mongoose.Schema.Types.Boolean,
        default: false
    },

    otp: {
        type: mongoose.Schema.Types.String,
        default: null
    },

    otpExpiresAt: {
        type: Date,
        default: null
    }

},
    {
    timestamps: true
});

module.exports = mongoose.model("User", userSchema);