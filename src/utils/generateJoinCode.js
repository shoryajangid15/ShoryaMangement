const crypto = require("crypto");

const generateJoinCode = (prefix = "KH") => {
    const randomBytes = crypto.randomBytes(3).toString("hex").toUpperCase();
    return `${prefix}-${randomBytes}`;
};

module.exports = generateJoinCode;
