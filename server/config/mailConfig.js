const nodemailer = require("nodemailer");

const hasCredentials =
  (process.env.EMAIL_USER && process.env.EMAIL_PASS) ||
  (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

const transporter = hasCredentials
  ? (process.env.SMTP_HOST
      ? nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: parseInt(process.env.SMTP_PORT, 10) || 587,
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        })
      : nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          },
        }))
  : nodemailer.createTransport({
      jsonTransport: true,
    });

// Verify SMTP connection configuration on server startup (non-test environments)
if (process.env.NODE_ENV !== 'test') {
  if (hasCredentials) {
    transporter.verify((error, success) => {
      if (error) {
        console.warn("⚠️ SMTP Transporter Verification Warning:", error.message);
      } else {
        console.log("✅ SMTP Server is ready to send emails");
      }
    });
  } else {
    console.warn("⚠️ SMTP credentials not configured (EMAIL_USER / EMAIL_PASS). Mail features running in graceful fallback mode.");
  }
}

module.exports = transporter;