const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { Student, LoginHistory } = require('../models');
const generateToken = require('../utils/generateToken');
const { logAudit, parseUserAgent } = require('../middleware/auditLogger');
const sendEmail = require('../utils/sendEmail');

// @desc    Register a new student
// @route   POST /api/student/register
// @access  Public
const registerStudent = async (req, res) => {
  try {
    const { fullName, rollNumber, email, department, year, password } = req.body;

    const emailExists = await Student.findOne({ where: { email: email.toLowerCase() } });
    if (emailExists) {
      return res.status(400).json({ message: 'A student with this email already exists' });
    }

    const rollExists = await Student.findOne({ where: { rollNumber: rollNumber.toUpperCase() } });
    if (rollExists) {
      return res.status(400).json({ message: 'A student with this roll number already exists' });
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenExpire = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 Hours
    const isTest = process.env.NODE_ENV === 'test';

    const referralCode = 'REF-' + Math.random().toString(36).substring(2, 8).toUpperCase();
    let referredBy = null;

    if (req.body.referredByCode) {
      const referringStudent = await Student.findOne({ where: { referralCode: req.body.referredByCode.trim().toUpperCase() } });
      if (referringStudent) {
        referredBy = referringStudent.id;
      }
    }

    const student = await Student.create({
      fullName,
      rollNumber: rollNumber.toUpperCase(),
      email: email.toLowerCase(),
      department,
      year,
      password,
      isVerified: isTest ? true : false,
      verificationToken: isTest ? null : verificationToken,
      verificationTokenExpire: isTest ? null : verificationTokenExpire,
      referralCode,
      referredBy,
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

      if (!isTest) {
        const verifyUrl = `${req.protocol}://${req.get('host').replace('5000', '5173')}/verify-email?token=${verificationToken}`;
        await sendEmail({
          to: student.email,
          subject: 'Verify Your Email - Sri Vasavi Event Portal',
          templateTitle: 'Email Verification Required',
          html: `
            <p>Dear <strong>${student.fullName}</strong>,</p>
            <p>Thank you for registering on the Sri Vasavi Event Management Portal.</p>
            <p>Please click the link below to verify your email address and activate your account (link expires in 24 hours):</p>
            <div style="text-align: center; margin: 25px 0;">
              <a href="${verifyUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Verify Email Address</a>
            </div>
            <p>If the button doesn't work, copy and paste this URL into your browser:</p>
            <p><a href="${verifyUrl}">${verifyUrl}</a></p>
          `
        }).catch(err => console.error('Verification email failed:', err.message));
      }

      await logAudit({ req, userId: student.id, userRole: 'Student', action: 'REGISTRATION', details: `Student registered: ${student.email}` });

      res.status(201).json({
        message: 'Registration successful! A verification link has been sent to your email. Please verify your account before logging in.',
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
    const student = await Student.findOne({ where: { verificationToken: token } });
    
    if (!student || !student.verificationTokenExpire || new Date() > new Date(student.verificationTokenExpire)) {
      return res.status(400).send(`
        <div style="font-family: Arial, sans-serif; text-align: center; margin-top: 100px; padding: 20px; border: 1px solid #ef4444; border-radius: 12px; max-width: 500px; margin-left: auto; margin-right: auto; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
          <h2 style="color: #ef4444; font-size: 24px; font-weight: bold; margin-bottom: 10px;">Verification Expired or Invalid</h2>
          <p style="color: #4b5563; font-size: 14px;">Your registration verification link has expired (expires after 24 hours) or is invalid. Please request a new verification link.</p>
        </div>
      `);
    }

    student.isVerified = true;
    student.verificationToken = null;
    student.verificationTokenExpire = null;
    await student.save();

    await logAudit({ userId: student.id, userRole: 'Student', action: 'EMAIL_VERIFICATION_SUCCESS', details: `Email verified successfully for ${student.email}` });

    res.send(`
      <div style="font-family: Arial, sans-serif; text-align: center; margin-top: 100px; padding: 20px; border: 1px solid #10b981; border-radius: 12px; max-width: 500px; margin-left: auto; margin-right: auto; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
        <h2 style="color: #10b981; font-size: 24px; font-weight: bold; margin-bottom: 10px;">Verification Successful!</h2>
        <p style="color: #4b5563; font-size: 14px;">Your account email is verified. You can now return to the portal and sign in.</p>
      </div>
    `);
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
      return res.status(400).json({ message: 'This email is already verified' });
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenExpire = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 Hours

    student.verificationToken = verificationToken;
    student.verificationTokenExpire = verificationTokenExpire;
    await student.save();

    const verifyUrl = `${req.protocol}://${req.get('host').replace('5000', '5173')}/verify-email?token=${verificationToken}`;
    await sendEmail({
      to: student.email,
      subject: 'Verify Your Email - Sri Vasavi Event Portal',
      templateTitle: 'Email Verification Required',
      html: `
        <p>Dear <strong>${student.fullName}</strong>,</p>
        <p>You requested a new verification link for the Sri Vasavi Event Management Portal.</p>
        <p>Please click the link below to verify your email address and activate your account (link expires in 24 hours):</p>
        <div style="text-align: center; margin: 25px 0;">
          <a href="${verifyUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Verify Email Address</a>
        </div>
        <p>If the button doesn't work, copy and paste this URL into your browser:</p>
        <p><a href="${verifyUrl}">${verifyUrl}</a></p>
      `
    });

    await logAudit({ req, userId: student.id, userRole: 'Student', action: 'RESEND_VERIFICATION_EMAIL', details: `Resent verification email to ${student.email}` });

    res.json({ message: 'Verification link has been resent to your email address.' });
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

    const student = await Student.findOne({ where: { email: email.toLowerCase() } });

    if (!student) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Lockout policy check
    if (student.lockoutUntil && new Date() < new Date(student.lockoutUntil)) {
      const minutesLeft = Math.ceil((new Date(student.lockoutUntil) - new Date()) / 60000);
      return res.status(423).json({
        message: `Account is temporarily locked out due to multiple failed login attempts. Please try again in ${minutesLeft} minute(s).`
      });
    }

    if (await student.comparePassword(password)) {
      if (!student.isVerified) {
        await logAudit({ req, userId: student.id, userRole: 'Student', action: 'LOGIN_UNVERIFIED', status: 'FAILED', details: 'Login rejected: email not verified' });
        return res.status(401).json({ message: 'Please verify your email address before logging in.' });
      }

      // Reset lockout/failures on successful login
      student.failedLoginAttempts = 0;
      student.lockoutUntil = null;

      const token = generateToken(student.id, 'Student');
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
        token,
        refreshToken: newRefreshToken,
      });
    } else {
      // Handle failed password attempts
      student.failedLoginAttempts += 1;
      let lockoutMsg = 'Invalid email or password';

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
