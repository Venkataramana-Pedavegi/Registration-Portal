const nodemailer = require("nodemailer");

const user = process.env.EMAIL_USER ? process.env.EMAIL_USER.trim() : '';
const pass = process.env.EMAIL_PASS ? process.env.EMAIL_PASS.trim() : '';
const smtpHost = process.env.SMTP_HOST ? process.env.SMTP_HOST.trim() : '';
const smtpUser = process.env.SMTP_USER ? process.env.SMTP_USER.trim() : '';
const smtpPass = process.env.SMTP_PASS ? process.env.SMTP_PASS.trim() : '';

const hasCredentials = (user && pass) || (smtpHost && smtpUser && smtpPass);

const transporter = hasCredentials
  ? (smtpHost
      ? nodemailer.createTransport({
          host: smtpHost,
          port: parseInt(process.env.SMTP_PORT, 10) || 587,
          secure: process.env.SMTP_SECURE === 'true',
          pool: true,
          maxConnections: 5,
          maxMessages: 100,
          rateLimit: 10,
          auth: {
            user: smtpUser,
            pass: smtpPass,
          },
        })
      : nodemailer.createTransport({
          service: "gmail",
          pool: true,
          maxConnections: 5,
          maxMessages: 100,
          rateLimit: 10,
          auth: {
            user,
            pass,
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