const nodemailer = require("nodemailer");

const sendEmail = async ({ to, subject, html, text }) => {
    try {
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || "smtp.gmail.com",
            port: parseInt(process.env.SMTP_PORT) || 587,
            secure: process.env.SMTP_PORT === "465", // true for 465, false for other ports
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });

        const mailOptions = {
            from: process.env.EMAIL_FROM || '"KasperTech DMS" <no-reply@kaspertech.com>',
            to,
            subject,
            text,
            html
        };

        const info = await transporter.sendMail(mailOptions);
        console.log("Email sent: %s", info.messageId);
        return info;
    } catch (error) {
        console.error("Error sending email:", error.message);
        throw error;
    }
};

module.exports = sendEmail;
