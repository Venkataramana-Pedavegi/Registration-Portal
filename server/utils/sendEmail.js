const transporter = require('../config/mailConfig');

/**
 * Generates responsive HTML wrapper with Sri Vasavi Engineering College logo header
 */
const buildEmailTemplate = ({ title, bodyContent }) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f6f9; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e5e7eb; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%); padding: 24px; text-align: center; color: #ffffff; }
        .title { font-size: 20px; font-weight: bold; margin: 0; letter-spacing: -0.5px; }
        .subtitle { font-size: 13px; color: #bfdbfe; margin-top: 4px; font-weight: 500; }
        .content { padding: 30px 25px; color: #1f2937; line-height: 1.6; font-size: 15px; }
        .footer { background: #f9fafb; padding: 18px 25px; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #f3f4f6; }
        .badge { display: inline-block; background: #eff6ff; color: #1d4ed8; padding: 4px 12px; border-radius: 9999px; font-weight: 600; font-size: 12px; margin-bottom: 15px; border: 1px solid #dbeafe; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 class="title">Sri Vasavi Engineering College</h1>
          <p class="subtitle">Campus Event Management Portal</p>
        </div>
        <div class="content">
          <div class="badge">${title}</div>
          ${bodyContent}
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} Sri Vasavi Engineering College. All rights reserved.<br/>
          Pedatadepalli, Tadepalligudem, Andhra Pradesh 534101
        </div>
      </div>
    </body>
    </html>
  `;
};

const sendEmail = async (options, subjectArg, htmlArg) => {
  try {
    let to, subject, html, text, templateTitle;

    if (typeof options === 'object' && options !== null) {
      to = options.to;
      subject = options.subject;
      html = options.html;
      text = options.text;
      templateTitle = options.templateTitle;
    } else {
      to = options;
      subject = subjectArg;
      html = htmlArg;
    }

    if (!to) {
      to = process.env.EMAIL_USER;
    }

    const formattedHtml = (html && html.includes('<!DOCTYPE html>'))
      ? html
      : buildEmailTemplate({ title: templateTitle || subject || 'Campus Event Notification', bodyContent: html || '' });

    // Fallback simulation mode in test environment
    if (process.env.NODE_ENV === 'test') {
      console.log(`[Email Simulation] To: ${to} | Subject: ${subject}`);
      return { success: true, messageId: 'simulated-id' };
    }

    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || 'Sri Vasavi Event Portal'}" <${process.env.EMAIL_USER}>`,
      to,
      subject: subject ? `[Sri Vasavi Events] ${subject}` : '[Sri Vasavi Events]',
      text: text || (html ? html.replace(/<[^>]*>?/gm, '') : ''),
      html: formattedHtml,
    };

    if (options && options.attachments) {
      mailOptions.attachments = options.attachments;
    }

    const info = await transporter.sendMail(mailOptions);

    console.log(`✅ Email sent successfully to ${to}: ${info.messageId}`);
    return { success: true, messageId: info.messageId, response: info.response, info };
  } catch (error) {
    console.error('❌ Error sending email:', error.message);
    return { success: false, error: error.message };
  }
};

module.exports = sendEmail;
