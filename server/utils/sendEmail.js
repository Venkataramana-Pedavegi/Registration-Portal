const defaultTransporter = require('../config/mailConfig');
const nodemailer = require('nodemailer');

let cachedTransporter = null;
let cachedBranding = null;
let lastCacheTime = 0;
const CACHE_TTL_MS = 60 * 1000; // Cache DB settings for 1 minute

const getCachedSettings = async () => {
  const now = Date.now();
  if (cachedBranding && cachedTransporter && now - lastCacheTime < CACHE_TTL_MS) {
    return { transporter: cachedTransporter, branding: cachedBranding };
  }

  try {
    const { SystemSetting } = require('../models');
    const settings = await SystemSetting.findAll();
    const settingsMap = {};
    settings.forEach((s) => {
      settingsMap[s.key] = s.value;
    });

    cachedBranding = {
      collegeName: settingsMap.collegeName || 'Sri Vasavi Engineering College',
      appName: settingsMap.appName || 'Campus Event Management Portal',
      smtpUser: (settingsMap.smtpUser || process.env.EMAIL_USER || 'admin@college.edu').trim(),
    };

    if (settingsMap.smtpHost && settingsMap.smtpUser && settingsMap.smtpPass) {
      cachedTransporter = nodemailer.createTransport({
        host: settingsMap.smtpHost,
        port: parseInt(settingsMap.smtpPort, 10) || 587,
        secure: settingsMap.smtpSecure === 'true',
        pool: true,
        maxConnections: 5,
        maxMessages: 100,
        rateLimit: 10,
        auth: {
          user: settingsMap.smtpUser,
          pass: settingsMap.smtpPass,
        },
      });
    } else {
      cachedTransporter = defaultTransporter;
    }

    lastCacheTime = now;
  } catch (err) {
    console.error('Failed to load system SMTP settings:', err.message);
    if (!cachedBranding) {
      cachedBranding = {
        collegeName: 'Sri Vasavi Engineering College',
        appName: 'Campus Event Management Portal',
        smtpUser: process.env.EMAIL_USER || 'admin@college.edu',
      };
    }
    if (!cachedTransporter) {
      cachedTransporter = defaultTransporter;
    }
  }

  return { transporter: cachedTransporter, branding: cachedBranding };
};

// Function to explicitly clear settings cache when Admin updates settings
const clearEmailSettingsCache = () => {
  cachedTransporter = null;
  cachedBranding = null;
  lastCacheTime = 0;
};

/**
 * Generates responsive HTML wrapper with college logo header
 */
const buildEmailTemplate = ({ title, bodyContent, branding }) => {
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
          <h1 class="title">${branding.collegeName}</h1>
          <p class="subtitle">${branding.appName}</p>
        </div>
        <div class="content">
          <div class="badge">${title}</div>
          ${bodyContent}
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} ${branding.collegeName}. All rights reserved.<br/>
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

    const { transporter, branding } = await getCachedSettings();

    if (!to) {
      to = branding.smtpUser;
    }

    const formattedHtml = (html && html.includes('<!DOCTYPE html>'))
      ? html
      : buildEmailTemplate({ title: templateTitle || subject || 'Campus Event Notification', bodyContent: html || '', branding });

    // Fallback simulation mode in test environment
    if (process.env.NODE_ENV === 'test') {
      console.log(`[Email Simulation] To: ${to} | Subject: ${subject}`);
      return { success: true, messageId: 'simulated-id' };
    }

    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || branding.appName}" <${branding.smtpUser}>`,
      to,
      subject: subject ? `[${branding.collegeName}] ${subject}` : `[${branding.collegeName}]`,
      text: text || (html ? html.replace(/<[^>]*>?/gm, '') : ''),
      html: formattedHtml,
    };

    if (options && options.attachments) {
      mailOptions.attachments = options.attachments;
    }

    let retries = 2;
    let info = null;
    let lastErr = null;

    while (retries > 0) {
      try {
        info = await transporter.sendMail(mailOptions);
        lastErr = null;
        break;
      } catch (err) {
        lastErr = err;
        retries--;
        if (retries > 0) {
          await new Promise((res) => setTimeout(res, 500));
        }
      }
    }

    if (lastErr) {
      throw lastErr;
    }

    console.log(`✅ Email sent successfully to ${to}: ${info.messageId}`);
    return { success: true, messageId: info.messageId, response: info.response, info };
  } catch (error) {
    console.error('❌ Error sending email:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Sends email messages to multiple recipients concurrently in controlled batches
 */
const sendBulkEmails = async (messages, concurrency = 5) => {
  const results = [];
  for (let i = 0; i < messages.length; i += concurrency) {
    const chunk = messages.slice(i, i + concurrency);
    const chunkResults = await Promise.all(
      chunk.map((msg) => sendEmail(msg))
    );
    results.push(...chunkResults);
  }
  return results;
};

sendEmail.clearEmailSettingsCache = clearEmailSettingsCache;
sendEmail.sendBulkEmails = sendBulkEmails;

module.exports = sendEmail;

