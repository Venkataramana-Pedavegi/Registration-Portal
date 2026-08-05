const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

// Verify SMTP connection configuration on server startup (non-test environments)
if (process.env.NODE_ENV !== 'test') {
    transporter.verify((error, success) => {
        if (error) {
            console.error("❌ SMTP Transporter Verification Failed:", error.message);
        } else {
            console.log("✅ SMTP Server is ready to send emails");
        }
    });
}

module.exports = transporter;