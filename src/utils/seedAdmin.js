const bcrypt = require("bcryptjs");
const Admin = require("../models/admin.models");

const seedDefaultAdmin = async () => {
    try {
        const defaultEmail = "admin@kaspertech.com";
        const defaultPassword = "admin123";

        const existingAdmin = await Admin.findOne({ email: defaultEmail });

        if (!existingAdmin) {
            const hashedPassword = await bcrypt.hash(defaultPassword, 10);
            await Admin.create({
                email: defaultEmail,
                passwordHash: hashedPassword,
                isActive: true
            });
            console.log(`Default Admin created successfully with hashed password!`);
            console.log(`Email: ${defaultEmail}`);
            console.log(`Password: ${defaultPassword}`);
        } else {
            // Agar existing password unhashed hai, usko bcrypt hash me convert kar do
            if (!existingAdmin.passwordHash.startsWith("$2")) {
                existingAdmin.passwordHash = await bcrypt.hash(defaultPassword, 10);
                await existingAdmin.save();
                console.log(`Existing Admin password updated to secure bcrypt hash!`);
            } else {
                console.log(`Default Admin already exists with hashed password: ${defaultEmail}`);
            }
        }
    } catch (error) {
        console.log("Error seeding default admin:", error.message);
    }
};

module.exports = seedDefaultAdmin;
