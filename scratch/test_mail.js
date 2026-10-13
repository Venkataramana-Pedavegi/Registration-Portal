const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../server/.env') });
const nodemailer = require('nodemailer');

console.log('EMAIL_USER:', process.env.EMAIL_USER);
console.log('EMAIL_PASS raw length:', process.env.EMAIL_PASS ? process.env.EMAIL_PASS.length : 0);
const cleanPass = process.env.EMAIL_PASS ? process.env.EMAIL_PASS.trim() : '';
console.log('EMAIL_PASS clean length:', cleanPass.length);

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER.trim(),
    pass: cleanPass,
  },
});

async function main() {
  try {
    console.log('Verifying SMTP connection...');
    await transporter.verify();
    console.log('✅ SMTP connection verified successfully!');

    console.log('Sending test email to', process.env.EMAIL_USER);
    const info = await transporter.sendMail({
      from: `"Sri Vasavi Engineering College" <${process.env.EMAIL_USER.trim()}>`,
      to: process.env.EMAIL_USER.trim(),
      subject: 'Test Email - Verification System Check',
      text: 'This is a test email to verify that Nodemailer and Gmail App Password are working 100%!',
      html: '<b>This is a test email to verify that Nodemailer and Gmail App Password are working 100%!</b>',
    });
    console.log('✅ Email sent successfully! Message ID:', info.messageId);
  } catch (err) {
    console.error('❌ Error testing email:', err);
  }
}

main();
