const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { Student, LoginHistory, sequelize } = require('../models');
const generateToken = require('../utils/generateToken');
const { logAudit, parseUserAgent } = require('../middleware/auditLogger');
const sendEmail = require('../utils/sendEmail');
const logDebug = require('../utils/debugLogger');

const logModelAndDbDetails = async (actionName, req) => {
  try {
    const [[dbResult]] = await sequelize.query('SELECT DATABASE() as db');
    const dbName = dbResult.db;
    
    const modelName = Student.name;
    const tableName = Student.tableName;
    
    logDebug(`[${actionName}] Verification Check:`);
    logDebug(`  - Request URL: ${req.originalUrl || req.url}`);
    logDebug(`  - Controller Executed: studentController.${actionName}`);
    logDebug(`  - Node Environment (NODE_ENV): ${process.env.NODE_ENV}`);
    logDebug(`  - Database currently connected: ${dbName}`);
    logDebug(`  - Student Model Name: ${modelName}`);
    logDebug(`  - Student Table Name: ${tableName}`);
    logDebug(`  - Sequelize Instance matches model: ${Student.sequelize === sequelize}`);
  } catch (err) {
    logDebug(`[${actionName}] Verification Check Failed: ${err.message}`);
  }
};

const getFrontendUrl = (req) => {
  if (process.env.FRONTEND_URL) {
    return process.env.FRONTEND_URL.trim().replace(/\/$/, '');
  }
  const origin = req.headers.origin || req.headers.referer;
  if (origin && !origin.includes('localhost:5000') && !origin.includes('railway.app') && !origin.includes('onrender.com')) {
    return origin.trim().replace(/\/$/, '');
  }
  return 'https://registration-portal-bice-seven.vercel.app';
};

const hasMailCredentials = () => {
  return !!(
    (process.env.EMAIL_USER && process.env.EMAIL_PASS) ||
    (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS)
  );
};

// @desc    Register a new student
// @route   POST /api/student/register
// @access  Public
const registerStudent = async (req, res) => {
  try {
    const { fullName, rollNumber, email, department, year, password, referralCode: reqReferralCode } = req.body;
    await logModelAndDbDetails('registerStudent', req);
    logDebug(`[registerStudent] Incoming request body: ${JSON.stringify(req.body)}`);

    // Check if student with email already exists
    let emailCheckSql = '';
    const existingStudentEmail = await Student.findOne({ 
      where: { email: email.toLowerCase() },
      logging: (sql) => {
        emailCheckSql = sql;
        logDebug(`[registerStudent] Email check SQL: ${sql}`);
      }
    });

    if (existingStudentEmail) {
      logDebug(`[registerStudent] Registration rejected: Email ${email} already exists.`);
      return res.status(400).json({ message: 'Email address is already registered' });
    }

    // Check if student with roll number already exists
    let rollCheckSql = '';
    const existingStudentRoll = await Student.findOne({ 
      where: { rollNumber: rollNumber.toUpperCase() },
      logging: (sql) => {
        rollCheckSql = sql;
        logDebug(`[registerStudent] Roll number check SQL: ${sql}`);
      }
    });

    if (existingStudentRoll) {
      logDebug(`[registerStudent] Registration rejected: Roll number ${rollNumber} already exists.`);
      return res.status(400).json({ message: 'Roll number is already registered' });
    }

    let referredBy = null;
    if (reqReferralCode) {
      const referringStudent = await Student.findOne({ where: { referralCode: reqReferralCode.trim() } });
      if (referringStudent) {
        referredBy = referringStudent.id;
      }
    }

    const emailBase64 = Buffer.from(email.toLowerCase()).toString('base64');
    const randomHex = crypto.randomBytes(16).toString('hex');
    const verificationToken = `${emailBase64}_${randomHex}`;
    const verificationTokenExpire = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 Hours
    const newReferralCode = `REF-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

    const mailConfigured = hasMailCredentials();
    const shouldAutoVerify = process.env.DISABLE_EMAIL_VERIFICATION === 'true' || !mailConfigured;

    const student = await Student.create({
      fullName: fullName.trim(),
      rollNumber: rollNumber.trim().toUpperCase(),
      email: email.trim().toLowerCase(),
      department,
      year,
      password,
      isVerified: shouldAutoVerify,
      verificationToken: shouldAutoVerify ? null : verificationToken,
      verificationTokenExpire: shouldAutoVerify ? null : verificationTokenExpire,
      referralCode: newReferralCode,
      referredBy,
    }, {
      logging: (sql) => logDebug(`[registerStudent] Insert Student SQL: ${sql}`)
    });

    if (student) {
      if (referredBy) {
        try {
          const { awardPoints } = require('../services/GamificationService');
          const referringStudent = await Student.findByPk(referredBy);
          if (referringStudent) {
            await awardPoints(
              referringStudent.id,
              15,
              'REFERRAL_REGISTRATION',
              `Referred student registration: ${student.fullName}`,
              student.id,
              req
            );
            await awardPoints(
              student.id,
              15,
              'REFERRAL_REGISTRATION',
              `Signed up via referral code of ${referringStudent.fullName}`,
              referringStudent.id,
              req
            );
          }
        } catch (gErr) {
          console.error('Non-blocking referral points allocation error:', gErr.message);
        }
      }

      if (process.env.NODE_ENV !== 'test' && !shouldAutoVerify) {
        const frontendUrl = getFrontendUrl(req);
        const verifyUrl = `${frontendUrl}/verify-email?token=${verificationToken}`;
        const logoUrl = `${frontendUrl}/sri_vasavi_logo.png`;
        const expiryTimeStr = verificationTokenExpire.toLocaleString();

        const emailHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; background-color: #f4f6f9; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e5e7eb; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
    .header { background-color: #1e3a8a; padding: 24px; text-align: center; color: #ffffff; }
    .logo { max-height: 80px; width: auto; margin-bottom: 12px; }
    .title { font-size: 20px; font-weight: bold; margin: 0; }
    .subtitle { font-size: 13px; color: #bfdbfe; margin-top: 4px; }
    .content { padding: 30px 25px; color: #1f2937; line-height: 1.6; font-size: 15px; }
    .button-container { text-align: center; margin: 25px 0; }
    .button { background-color: #2563eb; color: #ffffff !important; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 14px; }
    .url-box { background: #f9fafb; padding: 15px; border-radius: 8px; font-size: 12px; word-break: break-all; border: 1px solid #f3f4f6; margin-bottom: 20px; }
    .info-list { font-size: 13px; color: #6b7280; border-top: 1px solid #f3f4f6; padding-top: 15px; margin-top: 20px; }
    .footer { background: #f9fafb; padding: 18px 25px; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #f3f4f6; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="${logoUrl}" alt="College Logo" class="logo" />
      <h1 class="title">Sri Vasavi Engineering College</h1>
      <p class="subtitle">Campus Event Management Portal</p>
    </div>
    <div class="content">
      <p>Dear <strong>${student.fullName}</strong>,</p>
      <p>Thank you for registering on the Sri Vasavi Event Management Portal. We're excited to help you discover and participate in exciting college activities!</p>
      <p>Please click the button below to verify your email address and activate your account:</p>
      
      <div class="button-container">
        <a href="${verifyUrl}" class="button" target="_blank">Verify Email Address</a>
      </div>

      <div class="url-box">
        <strong>If the button above does not work, copy and paste this URL into your browser:</strong><br/>
        <a href="${verifyUrl}" style="color: #2563eb; text-decoration: none;">${verifyUrl}</a>
      </div>

      <div class="info-list">
        <p style="margin: 4px 0;">⏰ <strong>Expiry Time:</strong> This link will expire in 24 hours (on ${expiryTimeStr}).</p>
        <p style="margin: 4px 0;">🛡️ <strong>Security Notice:</strong> If you did not request this registration, please disregard this email. Your email address will not be activated without verification.</p>
        <p style="margin: 4px 0;">📞 <strong>Support Contact:</strong> For any assistance, please contact our support team at <a href="mailto:support@college.edu" style="color: #2563eb; text-decoration: none;">support@college.edu</a>.</p>
      </div>
    </div>
    <div class="footer">
      &copy; ${new Date().getFullYear()} Sri Vasavi Engineering College. All rights reserved.<br/>
      Pedatadepalli, Tadepalligudem, Andhra Pradesh 534101
    </div>
  </div>
</body>
</html>`;

        await sendEmail({
          to: student.email,
          subject: 'Verify Your Email - Sri Vasavi Event Portal',
          templateTitle: 'Email Verification Required',
          html: emailHtml
        }).then(res => {
          if (res.success) {
            console.log(`✅ Verification email dispatched to ${student.email}`);
          } else {
            console.warn(`⚠️ Verification email warning for ${student.email}:`, res.error);
          }
        }).catch(err => console.error('Verification email failed:', err.message));
      }

      await logAudit({ req, userId: student.id, userRole: 'Student', action: 'REGISTRATION', details: `Student registered: ${student.email}` });

      res.status(201).json({
        message: shouldAutoVerify
          ? 'Registration successful! Your account is active.'
          : 'Registration successful! A verification link has been sent to your email. Please verify your account before logging in.',
        _id: student.id,
        fullName: student.fullName,
        rollNumber: student.rollNumber,
        email: student.email,
        department: student.department,
        year: student.year,
        role: 'Student',
        token: generateToken(student.id, 'Student'),
      });
    } else {
      res.status(400).json({ message: 'Invalid student data' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error during registration', error: error.message });
  }
};

// @desc    Verify student email address
// @route   GET /api/student/verify/:token
// @access  Public
const verifyStudentEmail = async (req, res) => {
  try {
    const { token } = req.params;
    if (!token || !token.includes('_')) {
      return res.status(400).json({ message: 'Invalid verification link.' });
    }

    // Extract email from token
    const parts = token.split('_');
    const emailBase64 = parts[0];
    let email;
    try {
      email = Buffer.from(emailBase64, 'base64').toString('utf8');
    } catch (e) {
      return res.status(400).json({ message: 'Invalid verification link.' });
    }

    // Find student by email
    const student = await Student.findOne({ where: { email: email.toLowerCase() } });
    if (!student) {
      return res.status(400).json({ message: 'Invalid verification link.' });
    }

    // Check if already verified
    if (student.isVerified) {
      return res.json({ message: 'Email already verified. You can log in.' });
    }

    // If not verified, verify the token in the database
    if (student.verificationToken !== token) {
      return res.status(400).json({ message: 'Invalid verification link.' });
    }

    // Check if token has expired
    if (!student.verificationTokenExpire || new Date() > new Date(student.verificationTokenExpire)) {
      return res.status(400).json({ message: 'Verification link expired.' });
    }

    // Verify student
    student.isVerified = true;
    student.verificationToken = null;
    student.verificationTokenExpire = null;
    await student.save();

    await logAudit({ userId: student.id, userRole: 'Student', action: 'EMAIL_VERIFICATION_SUCCESS', details: `Email verified successfully for ${student.email}` });

    return res.json({ message: 'Email verified successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Error verifying email', error: error.message });
  }
};

// @desc    Resend verification email
// @route   POST /api/student/resend-verification
// @access  Public
const resendVerification = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email address is required' });
    }

    const student = await Student.findOne({ where: { email: email.toLowerCase() } });
    if (!student) {
      return res.status(404).json({ message: 'No student account found with this email' });
    }

    if (student.isVerified) {
      return res.status(400).json({ message: 'This email is already verified.' });
    }

    const emailBase64 = Buffer.from(student.email.toLowerCase()).toString('base64');
    const randomHex = crypto.randomBytes(16).toString('hex');
    const verificationToken = `${emailBase64}_${randomHex}`;
    const verificationTokenExpire = new Date(Date.now() + 24 * 60 * 60 * 1000);

    student.verificationToken = verificationToken;
    student.verificationTokenExpire = verificationTokenExpire;
    await student.save();

    const frontendUrl = getFrontendUrl(req);
    const verifyUrl = `${frontendUrl}/verify-email?token=${verificationToken}`;
    const logoUrl = `${frontendUrl}/sri_vasavi_logo.png`;
    const expiryTimeStr = verificationTokenExpire.toLocaleString();

    const emailHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; background-color: #f4f6f9; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e5e7eb; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
    .header { background-color: #1e3a8a; padding: 24px; text-align: center; color: #ffffff; }
    .logo { max-height: 80px; width: auto; margin-bottom: 12px; }
    .title { font-size: 20px; font-weight: bold; margin: 0; }
    .subtitle { font-size: 13px; color: #bfdbfe; margin-top: 4px; }
    .content { padding: 30px 25px; color: #1f2937; line-height: 1.6; font-size: 15px; }
    .button-container { text-align: center; margin: 25px 0; }
    .button { background-color: #2563eb; color: #ffffff !important; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 14px; }
    .url-box { background: #f9fafb; padding: 15px; border-radius: 8px; font-size: 12px; word-break: break-all; border: 1px solid #f3f4f6; margin-bottom: 20px; }
    .info-list { font-size: 13px; color: #6b7280; border-top: 1px solid #f3f4f6; padding-top: 15px; margin-top: 20px; }
    .footer { background: #f9fafb; padding: 18px 25px; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #f3f4f6; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="${logoUrl}" alt="College Logo" class="logo" />
      <h1 class="title">Sri Vasavi Engineering College</h1>
      <p class="subtitle">Campus Event Management Portal</p>
    </div>
    <div class="content">
      <p>Dear <strong>${student.fullName}</strong>,</p>
      <p>You recently requested a new verification link for your Sri Vasavi Event Management Portal account.</p>
      <p>Please click the button below to verify your email address and activate your account:</p>
      
      <div class="button-container">
        <a href="${verifyUrl}" class="button" target="_blank">Verify Email Address</a>
      </div>

      <div class="url-box">
        <strong>If the button above does not work, copy and paste this URL into your browser:</strong><br/>
        <a href="${verifyUrl}" style="color: #2563eb; text-decoration: none;">${verifyUrl}</a>
      </div>

      <div class="info-list">
        <p style="margin: 4px 0;">⏰ <strong>Expiry Time:</strong> This link will expire in 24 hours (on ${expiryTimeStr}).</p>
        <p style="margin: 4px 0;">🛡️ <strong>Security Notice:</strong> If you did not request this link, please disregard this email. Your account security remains intact.</p>
        <p style="margin: 4px 0;">📞 <strong>Support Contact:</strong> For any assistance, please contact our support team at <a href="mailto:support@college.edu" style="color: #2563eb; text-decoration: none;">support@college.edu</a>.</p>
      </div>
    </div>
    <div class="footer">
      &copy; ${new Date().getFullYear()} Sri Vasavi Engineering College. All rights reserved.<br/>
      Pedatadepalli, Tadepalligudem, Andhra Pradesh 534101
    </div>
  </div>
</body>
</html>`;

    const mailResult = await sendEmail({
      to: student.email,
      subject: 'Verify Your Email - Sri Vasavi Event Portal',
      templateTitle: 'Email Verification Required',
      html: emailHtml
    });

    await logAudit({ req, userId: student.id, userRole: 'Student', action: 'RESEND_VERIFICATION_EMAIL', details: `Resent verification email to ${student.email}` });

    if (mailResult.success) {
      res.json({ message: 'Verification link has been resent to your email address.' });
    } else {
      res.json({ message: `Verification link generated: ${verifyUrl}`, verifyUrl });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error resending verification email', error: error.message });
  }
};

// @desc    Auth student & get token
// @route   POST /api/student/login
// @access  Public
const loginStudent = async (req, res) => {
  try {
    const { email, password } = req.body;
    await logModelAndDbDetails('loginStudent', req);
    logDebug(`[loginStudent] Incoming email: ${email}`);

    let querySql = '';
    const student = await Student.findOne({ 
      where: { email: email.toLowerCase() },
      logging: (sql) => {
        querySql = sql;
        logDebug(`[loginStudent] SQL Query executed: ${sql}`);
      }
    });

    logDebug(`[loginStudent] Student record returned by Sequelize: ${student ? JSON.stringify(student.toJSON()) : 'null'}`);

    if (!student) {
      logDebug(`[loginStudent] Student NOT found with email: ${email}`);
      return res.status(401).json({ message: 'No student account found with this email' });
    }

    const mailConfigured = hasMailCredentials();
    const verificationRequired = process.env.NODE_ENV !== 'test' && process.env.DISABLE_EMAIL_VERIFICATION !== 'true' && mailConfigured;

    if (!student.isVerified && verificationRequired) {
      return res.status(400).json({ message: 'Please verify your email before logging in.' });
    }

    logDebug(`[loginStudent] Student found: ${email} (ID: ${student.id})`);

    // Lockout policy check
    if (student.lockoutUntil && new Date() < new Date(student.lockoutUntil)) {
      const minutesLeft = Math.ceil((new Date(student.lockoutUntil) - new Date()) / 60000);
      logDebug(`[loginStudent] Login rejected: Locked out for ${minutesLeft} minutes.`);
      return res.status(423).json({
        message: `Account is temporarily locked out due to multiple failed login attempts. Please try again in ${minutesLeft} minute(s).`
      });
    }

    const isPasswordMatch = await student.comparePassword(password);
    logDebug(`[loginStudent] Password comparison result for ${email}: ${isPasswordMatch}`);

    if (isPasswordMatch) {
      // Reset lockout/failures on successful login
      student.failedLoginAttempts = 0;
      student.lockoutUntil = null;

      const token = generateToken(student.id, 'Student');
      if (token) {
        logDebug(`[loginStudent] JWT token generated successfully for ${email}`);
      } else {
        logDebug(`[loginStudent] JWT token generation FAILED for ${email}`);
      }

      const newRefreshToken = jwt.sign(
        { id: student.id, role: 'Student' },
        process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret_for_dev_only',
        { expiresIn: '7d' }
      );

      student.refreshToken = newRefreshToken;
      await student.save();

      // Location & Device change detection
      const ipAddress = (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1').split(',')[0].trim();
      const userAgentStr = req.headers['user-agent'] || '';
      const { browser, os } = parseUserAgent(userAgentStr);

      const pastLoginsCount = await LoginHistory.count({
        where: { userId: student.id, userRole: 'Student' }
      });

      if (pastLoginsCount > 0) {
        // Detect browser/device change
        const knownDevice = await LoginHistory.findOne({
          where: { userId: student.id, userRole: 'Student', browser, device: os }
        });

        // Detect location/IP address change
        const knownIP = await LoginHistory.findOne({
          where: { userId: student.id, userRole: 'Student', ipAddress }
        });

        if (!knownDevice || !knownIP) {
          // Send security alert email
          await sendEmail({
            to: student.email,
            subject: 'Security Alert: New Sign-in Detected',
            templateTitle: 'Security Notification',
            html: `
              <p>Hello <strong>${student.fullName}</strong>,</p>
              <p>We detected a login to your account from a new location or device:</p>
              <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 15px 0; font-family: monospace; font-size: 13px;">
                <strong>IP Address:</strong> ${ipAddress}<br/>
                <strong>Device/OS:</strong> ${os}<br/>
                <strong>Browser:</strong> ${browser}<br/>
                <strong>Date/Time:</strong> ${new Date().toLocaleString()}
              </div>
              <p>If this was you, no action is needed. If you do not recognize this activity, please reset your password immediately to protect your account.</p>
            `
          }).catch(err => console.error('Alert email failed:', err.message));
        }
      }

      // Add to Login History
      await LoginHistory.create({
        userId: student.id,
        userRole: 'Student',
        ipAddress,
        device: os,
        browser,
      });

      await logAudit({ req, userId: student.id, userRole: 'Student', action: 'LOGIN', status: 'SUCCESS', details: 'Student logged in successfully' });

      const { Volunteer } = require('../models');
      const { Op } = require('sequelize');
      const approvedVol = await Volunteer.findOne({
        where: { studentId: student.id, status: { [Op.in]: ['approved', 'Approved'] } }
      });

      res.json({
        id: student.id,
        _id: student.id,
        fullName: student.fullName,
        rollNumber: student.rollNumber,
        email: student.email,
        department: student.department,
        year: student.year,
        profileImage: student.profileImage,
        role: 'Student',
        isApprovedVolunteer: !!approvedVol,
        token,
        refreshToken: newRefreshToken,
      });
    } else {
      // Handle failed password attempts
      student.failedLoginAttempts += 1;
      let lockoutMsg = 'Incorrect password';

      if (student.failedLoginAttempts >= 5) {
        student.lockoutUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 Min Lock
        student.failedLoginAttempts = 0;
        lockoutMsg = 'Too many failed login attempts. Your account has been temporarily locked for 15 minutes.';
        
        await sendEmail({
          to: student.email,
          subject: 'Security Alert: Account Locked out',
          templateTitle: 'Account Security Locked',
          html: `
            <p>Dear student,</p>
            <p>Your account has been locked out for 15 minutes due to 5 consecutive failed login attempts.</p>
            <p>If you forgot your password, please use the "Forgot Password" option to reset it securely.</p>
          `
        }).catch(err => console.error('Lockout email failed:', err.message));
      }

      await student.save();

      await logAudit({ req, userId: student.id, userRole: 'Student', action: 'LOGIN', status: 'FAILED', details: `Failed login attempt. Attempts count: ${student.failedLoginAttempts}` });

      res.status(401).json({ message: lockoutMsg });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error during login', error: error.message });
  }
};

// @desc    Get student profile
// @route   GET /api/student/profile
// @access  Private
const getStudentProfile = async (req, res) => {
  try {
    const student = await Student.findByPk(req.user.id);

    if (student) {
      const { Volunteer } = require('../models');
      const { Op } = require('sequelize');
      const approvedVol = await Volunteer.findOne({
        where: { studentId: student.id, status: { [Op.in]: ['approved', 'Approved'] } }
      });

      res.json({
        id: student.id,
        _id: student.id,
        fullName: student.fullName,
        rollNumber: student.rollNumber,
        email: student.email,
        department: student.department,
        year: student.year,
        profileImage: student.profileImage,
        role: 'Student',
        isApprovedVolunteer: !!approvedVol,
        createdAt: student.createdAt,
        updatedAt: student.updatedAt,
      });
    } else {
      res.status(404).json({ message: 'Student not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error retrieving profile', error: error.message });
  }
};

module.exports = {
  registerStudent,
  verifyStudentEmail,
  resendVerification,
  loginStudent,
  getStudentProfile,
};
