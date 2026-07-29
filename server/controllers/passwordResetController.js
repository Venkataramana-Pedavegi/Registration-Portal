const crypto = require('crypto');
const { Student, Admin } = require('../models');
const sendEmail = require('../utils/sendEmail');
const { logAudit } = require('../middleware/auditLogger');

// @desc    Request password reset email
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email address is required' });

    const normalizedEmail = email.toLowerCase().trim();

    // Check Student or Admin
    let user = await Student.findOne({ where: { email: normalizedEmail } });
    let role = 'Student';

    if (!user) {
      user = await Admin.findOne({ where: { email: normalizedEmail } });
      role = 'Admin';
    }

    if (!user) {
      // Return 200 for security so attackers cannot enumerate registered emails
      return res.json({ message: 'If an account exists with that email, a password reset link has been sent.' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpire = new Date(Date.now() + 60 * 60 * 1000); // 1 Hour
    await user.save();

    const resetUrl = `${req.protocol}://${req.get('host')}/reset-password/${resetToken}`;

    const html = `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
        <h2 style="color: #1E3A8A;">Password Reset Request</h2>
        <p>You requested a password reset for your College Event Portal account.</p>
        <p>Click the link below to reset your password (valid for 1 hour):</p>
        <a href="${resetUrl}" style="background-color: #2563EB; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
        <p style="margin-top: 20px; font-size: 12px; color: #777;">If you did not request this, please ignore this email.</p>
      </div>
    `;

    await sendEmail({
      to: user.email,
      subject: 'Password Reset Request - College Event System',
      html,
    });

    await logAudit({ req, userId: user.id, userRole: role, action: 'FORGOT_PASSWORD_REQUEST', details: `Token generated for ${user.email}` });

    res.json({ message: 'If an account exists with that email, a password reset link has been sent.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error processing forgot password', error: error.message });
  }
};

// @desc    Reset password using token
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: 'Token and a valid new password (min 6 chars) are required' });
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Search Student first, then Admin
    let user = await Student.findOne({
      where: {
        resetPasswordToken: hashedToken,
      },
    });

    let role = 'Student';

    if (!user) {
      user = await Admin.findOne({
        where: {
          resetPasswordToken: hashedToken,
        },
      });
      role = 'Admin';
    }

    if (!user || !user.resetPasswordExpire || new Date(user.resetPasswordExpire) < new Date()) {
      return res.status(400).json({ message: 'Invalid or expired password reset token' });
    }

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

module.exports = {
  forgotPassword,
  resetPassword,
};
