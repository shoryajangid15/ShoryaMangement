const bcrypt = require("bcryptjs");
const Admin = require("../models/admin.models");

const seedDefaultAdmin = async () => {
    try {
        const adminsToSeed = [
            { email: "Skj15082005@gmail.com", password: "Shorya@15" },
            { email: "admin@kaspertech.com", password: "admin123" }
        ];

        for (const adminData of adminsToSeed) {
            const existingAdmin = await Admin.findOne({ email: adminData.email });

            if (!existingAdmin) {
                const hashedPassword = await bcrypt.hash(adminData.password, 10);
                await Admin.create({
                    email: adminData.email,
                    passwordHash: hashedPassword,
                    isActive: true
                });
                console.log(`Admin created: ${adminData.email}`);
            } else {
                if (!existingAdmin.passwordHash.startsWith("$2")) {
                    existingAdmin.passwordHash = await bcrypt.hash(adminData.password, 10);
                    await existingAdmin.save();
                    console.log(`Admin password hashed for: ${adminData.email}`);
                }
            }
        }
    } catch (error) {
        console.log("Error seeding default admin:", error.message);
    }
};

module.exports = seedDefaultAdmin;
