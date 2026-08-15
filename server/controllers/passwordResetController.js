const crypto = require('crypto');
const { Student, Admin, TokenBlacklist } = require('../models');
const sendEmail = require('../utils/sendEmail');
const { logAudit } = require('../middleware/auditLogger');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const logDebug = require('../utils/debugLogger');

// Helper to determine if user exists and get role
const findUserByEmail = async (email) => {
  const normalized = email.toLowerCase().trim();
  let user = await Student.findOne({ where: { email: normalized } });
  let role = 'Student';

  if (!user) {
    user = await Admin.findOne({ where: { email: normalized } });
    role = 'Admin';
  }
  return { user, role };
};

// @desc    Request password reset email (Generates 6-digit OTP code)
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email address is required' });

    const { user, role } = await findUserByEmail(email);

    if (!user) {
      return res.status(404).json({ message: 'Email is not registered.' });
    }

    // Generate 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    logDebug(`[ForgotPassword] Generated plain OTP for ${email}: ${otpCode}`);
    const hashedOtp = crypto.createHash('sha256').update(otpCode).digest('hex');

    user.otpCode = hashedOtp;
    user.otpExpire = new Date(Date.now() + 10 * 60 * 1000); // 10 Minutes
    user.otpAttempts = 0;
    await user.save();

    const name = user.fullName || user.username || 'Student';

    const html = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; padding: 30px; color: #1f2937; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 16px; background-color: #ffffff; box-shadow: 0 4px 10px rgba(0,0,0,0.03);">
        <div style="text-align: center; margin-bottom: 20px;">
          <img src="https://raw.githubusercontent.com/Ramana-pedavegi/Registration-Portal/main/server/sri_vasavi_logo.png" alt="Sri Vasavi Engineering College" style="height: 60px; object-contain; margin-bottom: 10px;" />
          <h2 style="color: #1e3a8a; font-size: 22px; font-weight: 800; margin: 0;">Sri Vasavi Engineering College</h2>
          <p style="color: #6b7280; font-size: 13px; margin: 2px 0 0 0;">Campus Event & Registration Portal</p>
        </div>
        
        <div style="border-top: 1px solid #f3f4f6; padding-top: 20px;">
          <p style="font-size: 14px; line-height: 1.5; color: #374151;">Dear <strong>${name}</strong>,</p>
          <p style="font-size: 14px; line-height: 1.5; color: #4b5563;">You recently requested to reset the password associated with your account. Use the secure One-Time Password (OTP) verification code below to authorize this change:</p>
          
          <div style="font-size: 32px; font-weight: 800; background-color: #f8fafc; border: 1px dashed #cbd5e1; padding: 18px; text-align: center; border-radius: 12px; margin: 25px 0; color: #2563eb; letter-spacing: 8px; font-family: monospace;">
            ${otpCode}
          </div>
          
          <p style="font-size: 13px; line-height: 1.5; color: #475569;">
            🕒 This code is valid for exactly <strong>10 minutes</strong>. After expiration, you will need to request a new verification OTP.
          </p>
          
          <div style="margin: 25px 0; padding: 15px; background-color: #fef2f2; border: 1px solid #fee2e2; border-radius: 12px; display: flex; gap: 10px;">
            <div style="color: #dc2626; font-weight: bold; font-size: 13px;">⚠️ Security Advisory:</div>
            <div style="color: #991b1b; font-size: 12px; line-height: 1.4;">
              Do not share this OTP code with anyone under any circumstances. Support staff will never ask for your verification code. If you did not trigger this request, please ignore this notice.
            </div>
          </div>
        </div>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #f3f4f6; font-size: 11px; color: #94a3b8; text-align: center; line-height: 1.5;">
          For support inquiries, contact us at <a href="mailto:support@srivasavi.edu" style="color: #2563eb; text-decoration: none;">support@srivasavi.edu</a><br />
          &copy; ${new Date().getFullYear()} Sri Vasavi Engineering College. All rights reserved.
        </div>
      </div>
    `;

    const mailResult = await sendEmail({
      to: user.email,
      subject: 'Password Reset OTP - Sri Vasavi Event Portal',
      templateTitle: 'Password Reset OTP',
      html,
    });

    await logAudit({ req, userId: user.id, userRole: role, action: 'FORGOT_PASSWORD_REQUEST', details: `OTP generated for ${user.email}` });

    const resPayload = {
      message: 'A 6-digit password reset OTP code has been sent to your email address.',
    };

    if (!mailResult || !mailResult.success || process.env.NODE_ENV !== 'production' || mailResult.messageId === 'simulated-id') {
      resPayload.demoOtp = otpCode;
    }

    res.json(resPayload);
  } catch (error) {
    res.status(500).json({ message: 'Server error processing forgot password', error: error.message });
  }
};

// @desc    Verify 6-digit OTP & Return 15-minute Secure Token
// @route   POST /api/auth/verify-otp
// @access  Public
const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required' });
    }

    const { user, role } = await findUserByEmail(email);
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or expired OTP' });
    }

    if (user.otpAttempts >= 5) {
      return res.status(400).json({ message: 'Too many failed OTP attempts. Please request a new OTP.' });
    }

    if (!user.otpCode || !user.otpExpire || new Date() > new Date(user.otpExpire)) {
      return res.status(400).json({ message: 'OTP has expired or is invalid' });
    }

    const hashedInput = crypto.createHash('sha256').update(otp.trim()).digest('hex');

    if (user.otpCode !== hashedInput) {
      user.otpAttempts += 1;
      await user.save();
      await logAudit({ req, userId: user.id, userRole: role, action: 'OTP_VERIFICATION_FAILED', status: 'FAILED', details: `Failed OTP attempt: ${user.otpAttempts}/5` });
      return res.status(400).json({ message: `Invalid OTP code. You have ${5 - user.otpAttempts} attempts remaining.` });
    }

    // OTP verified successfully, generate 15-minute secure token
    const secureToken = crypto.randomBytes(32).toString('hex');
    const hashedSecureToken = crypto.createHash('sha256').update(secureToken).digest('hex');

    user.resetPasswordToken = hashedSecureToken;
    user.resetPasswordExpire = new Date(Date.now() + 15 * 60 * 1000); // 15 Minutes
    // Clear OTP
    user.otpCode = null;
    user.otpExpire = null;
    user.otpAttempts = 0;
    await user.save();

    await logAudit({ req, userId: user.id, userRole: role, action: 'OTP_VERIFICATION_SUCCESS', details: `OTP verified for ${user.email}, reset token generated` });

    res.json({
      message: 'OTP verified successfully. You can now reset your password.',
      token: secureToken,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error verifying OTP', error: error.message });
  }
};

// @desc    Reset password using token
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    const isStrongPassword = (pass) => {
      return pass && pass.length >= 8 && /[A-Z]/.test(pass) && /[a-z]/.test(pass) && /\d/.test(pass) && /\W/.test(pass);
    };

    if (!token || !newPassword || !isStrongPassword(newPassword)) {
      return res.status(400).json({
        message: 'Token and a strong new password are required. Password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number, and one special character.',
      });
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    let user = await Student.findOne({ where: { resetPasswordToken: hashedToken } });
    let role = 'Student';

    if (!user) {
      user = await Admin.findOne({ where: { resetPasswordToken: hashedToken } });
      role = 'Admin';
    }

    if (!user || !user.resetPasswordExpire || new Date(user.resetPasswordExpire) < new Date()) {
      return res.status(400).json({ message: 'Invalid or expired password reset token' });
    }

    // Password History reuse check (last 5 passwords)
    let history = [];
    try {
      history = JSON.parse(user.passwordHistory || '[]');
    } catch (e) {
      history = [];
    }

    const matchCurrent = await user.comparePassword(newPassword);
    let matchHistory = false;
    for (const oldHash of history) {
      if (await bcrypt.compare(newPassword, oldHash)) {
        matchHistory = true;
        break;
      }
    }

    if (matchCurrent || matchHistory) {
      return res.status(400).json({ message: 'You cannot reuse any of your last 5 passwords.' });
    }

    // Add current password to history queue
    history.unshift(user.password);
    if (history.length > 5) {
      history = history.slice(0, 5);
    }
    user.passwordHistory = JSON.stringify(history);

    user.password = newPassword;
    user.resetPasswordToken = null;
    user.resetPasswordExpire = null;
    await user.save();

    await logAudit({ req, userId: user.id, userRole: role, action: 'RESET_PASSWORD_SUCCESS', details: `Password reset successfully for ${user.email}` });

    res.json({ message: 'Password has been reset successfully. You may now log in.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error resetting password', error: error.message });
  }
};

// @desc    Refresh JSON Web Tokens
// @route   POST /api/auth/refresh
// @access  Public
const refreshTokens = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ message: 'Refresh token is required' });
    }

    let decoded;
    try {
      decoded = jwt.verify(
        refreshToken,
        process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret_for_dev_only'
      );
    } catch (err) {
      return res.status(401).json({ message: 'Invalid or expired refresh token' });
    }

    const { id, role } = decoded;
    let user;

    if (role === 'Admin') {
      user = await Admin.findByPk(id);
    } else {
      user = await Student.findByPk(id);
    }

    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({ message: 'Invalid refresh token session' });
    }

    const generateToken = require('../utils/generateToken');
    const newAccessToken = generateToken(user.id, role);
    
    const newRefreshToken = jwt.sign(
      { id: user.id, role },
      process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret_for_dev_only',
      { expiresIn: '7d' }
    );

    user.refreshToken = newRefreshToken;
    await user.save();

    res.json({
      token: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error refreshing tokens', error: error.message });
  }
};

// @desc    Logout User & Invalidate Tokens
// @route   POST /api/auth/logout
// @access  Private
const logoutUser = async (req, res) => {
  try {
    const userId = req.user.id;
    const role = req.role;

    if (role === 'Admin') {
      await Admin.update({ refreshToken: null }, { where: { id: userId } });
    } else {
      await Student.update({ refreshToken: null }, { where: { id: userId } });
    }

    // Invalidate Access Token via Blacklist
    let token = '';
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      try {
        const decoded = jwt.decode(token);
        const expiresAt = decoded && decoded.exp 
          ? new Date(decoded.exp * 1000) 
          : new Date(Date.now() + 24 * 60 * 60 * 1000); // Fallback 24h

        await TokenBlacklist.create({
          token,
          expiresAt,
        });
      } catch (err) {
        console.error('Failed to blacklist token:', err.message);
      }
    }

    await logAudit({ req, userId, userRole: role, action: 'LOGOUT', details: 'User logged out successfully' });

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error during logout', error: error.message });
  }
};

module.exports = {
  forgotPassword,
  verifyOTP,
  resetPassword,
  refreshTokens,
  logoutUser,
};
