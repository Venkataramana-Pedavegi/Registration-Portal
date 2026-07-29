const nodemailer = require('nodemailer');

const sendEmail = async ({ to, subject, html, text }) => {
  try {
    // If SMTP host is not configured, simulate email logging in non-blocking fallback mode
    if (!process.env.SMTP_HOST || process.env.NODE_ENV === 'test') {
      console.log(`[Email Simulation] To: ${to} | Subject: ${subject}`);
      return { messageId: 'simulated-id' };
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const info = await transporter.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME || 'College Event System'}" <${process.env.EMAIL_FROM_ADDRESS || 'noreply@college.edu'}>`,
      to,
      subject,
      text: text || html.replace(/<[^>]*>?/gm, ''),
      html,
    });

    console.log(`Email sent: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error('Error sending email:', error.message);
    // Non-blocking fallback so user flows do not fail if SMTP configuration is wrong
    return null;
  }
};

module.exports = sendEmail;
