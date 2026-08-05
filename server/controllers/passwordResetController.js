const crypto = require('crypto');
const { Student, Admin, TokenBlacklist } = require('../models');
const sendEmail = require('../utils/sendEmail');
const { logAudit } = require('../middleware/auditLogger');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

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
      // Return 200 for security to prevent account enumeration
      return res.json({ message: 'If an account exists with that email, a password reset link has been sent (OTP code included).' });
    }

    // Generate 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOtp = crypto.createHash('sha256').update(otpCode).digest('hex');

    user.otpCode = hashedOtp;
    user.otpExpire = new Date(Date.now() + 5 * 60 * 1000); // 5 Minutes
    user.otpAttempts = 0;
    await user.save();

    const html = `
      <div style="font-family: Arial, sans-serif; padding: 25px; color: #1f2937; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
        <h2 style="color: #2563eb; font-size: 20px; font-weight: bold; border-bottom: 2px solid #eff6ff; padding-bottom: 10px; margin-top: 0;">Sri Vasavi Event Portal - Password Reset OTP</h2>
        <p>You requested to reset your password. Please use the following 6-digit One-Time Password (OTP) to verify your identity:</p>
        <div style="font-size: 28px; font-weight: bold; background-color: #f3f4f6; padding: 20px; text-align: center; border-radius: 10px; margin: 25px 0; color: #1e3a8a; letter-spacing: 6px;">
          ${otpCode}
        </div>
        <p style="color: #ef4444; font-weight: 600; font-size: 13px;">⚠️ This OTP is valid for 5 minutes only. Do not share this OTP with anyone.</p>
        <p style="margin-top: 25px; font-size: 12px; color: #6b7280; border-top: 1px solid #f3f4f6; padding-top: 15px;">If you did not request this password reset, please ignore this email or contact support if you suspect unauthorized access.</p>
      </div>
    `;

    await sendEmail({
      to: user.email,
      subject: 'Password Reset OTP - Sri Vasavi Event Portal',
      templateTitle: 'Password Reset OTP',
      html,
    });

    await logAudit({ req, userId: user.id, userRole: role, action: 'FORGOT_PASSWORD_REQUEST', details: `OTP generated for ${user.email}` });

    res.json({ message: 'If an account exists with that email, a password reset link has been sent (OTP code included).' });
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
