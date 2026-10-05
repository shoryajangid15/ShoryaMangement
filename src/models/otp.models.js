const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema({
    email: {
        type: mongoose.Schema.Types.String,
        required: true,
        lowercase: true,
        trim: true,
        index: true
    },
    otp: {
        type: mongoose.Schema.Types.String,
        required: true
    },
    expiresAt: {
        type: Date,
        required: true,
        index: { expires: 0 }
    }
}, {
    timestamps: true
});

module.exports = mongoose.model("Otp", otpSchema);
