const { Admin, LoginHistory } = require('../models');
const generateToken = require('../utils/generateToken');
const { logAudit, parseUserAgent } = require('../middleware/auditLogger');
const sendEmail = require('../utils/sendEmail');
const jwt = require('jsonwebtoken');

// @desc    Auth admin & get token
// @route   POST /api/admin/login
// @access  Public
const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const admin = await Admin.findOne({ where: { email: email.toLowerCase() } });

    if (!admin) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Lockout policy check
    if (admin.lockoutUntil && new Date() < new Date(admin.lockoutUntil)) {
      const minutesLeft = Math.ceil((new Date(admin.lockoutUntil) - new Date()) / 60000);
      return res.status(423).json({
        message: `Account is temporarily locked out due to multiple failed login attempts. Please try again in ${minutesLeft} minute(s).`
      });
    }

    if (await admin.comparePassword(password)) {
      // Reset lockout/failures
      admin.failedLoginAttempts = 0;
      admin.lockoutUntil = null;

      const token = generateToken(admin.id, admin.role || 'Admin');
      const newRefreshToken = jwt.sign(
        { id: admin.id, role: admin.role || 'Admin' },
        process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret_for_dev_only',
        { expiresIn: '7d' }
      );

      admin.refreshToken = newRefreshToken;
      await admin.save();

      // Device & Location checks
      const ipAddress = (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1').split(',')[0].trim();
      const userAgentStr = req.headers['user-agent'] || '';
      const { browser, os } = parseUserAgent(userAgentStr);

      const pastLoginsCount = await LoginHistory.count({
        where: { userId: admin.id, userRole: admin.role || 'Admin' }
      });

      if (pastLoginsCount > 0) {
        const knownDevice = await LoginHistory.findOne({
          where: { userId: admin.id, userRole: admin.role || 'Admin', browser, device: os }
        });

        const knownIP = await LoginHistory.findOne({
          where: { userId: admin.id, userRole: admin.role || 'Admin', ipAddress }
        });

        if (!knownDevice || !knownIP) {
          // Send security alert email
          await sendEmail({
            to: admin.email,
            subject: 'Security Alert: New Sign-in Detected',
            templateTitle: 'Admin Security Alert',
            html: `
              <p>Hello <strong>${admin.username}</strong>,</p>
              <p>We detected an administrative sign-in from a new device or IP location:</p>
              <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 15px 0; font-family: monospace; font-size: 13px;">
                <strong>IP Address:</strong> ${ipAddress}<br/>
                <strong>Device/OS:</strong> ${os}<br/>
                <strong>Browser:</strong> ${browser}<br/>
                <strong>Date/Time:</strong> ${new Date().toLocaleString()}
              </div>
              <p>If this was not you, please perform an immediate password reset on your administrator settings page.</p>
            `
          }).catch(err => console.error('Admin alert email failed:', err.message));
        }
      }

      // Record Login History
      await LoginHistory.create({
        userId: admin.id,
        userRole: admin.role || 'Admin',
        ipAddress,
        device: os,
        browser,
      });

      await logAudit({ req, userId: admin.id, userRole: admin.role || 'Admin', action: 'LOGIN', status: 'SUCCESS', details: 'Admin logged in successfully' });

      res.json({
        _id: admin.id,
        username: admin.username,
        email: admin.email,
        role: admin.role || 'Admin',
        token,
        refreshToken: newRefreshToken,
      });
    } else {
      // Failed login attempt tracking
      admin.failedLoginAttempts += 1;
      let lockoutMsg = 'Invalid email or password';

      if (admin.failedLoginAttempts >= 5) {
        admin.lockoutUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 mins lock
        admin.failedLoginAttempts = 0;
        lockoutMsg = 'Too many failed login attempts. Your account has been temporarily locked for 15 minutes.';

        await sendEmail({
          to: admin.email,
          subject: 'Security Alert: Admin Account Locked Out',
          templateTitle: 'Account Locked Out',
          html: `
            <p>Dear Administrator,</p>
            <p>Your admin account has been locked for 15 minutes due to 5 consecutive failed login attempts.</p>
          `
        }).catch(err => console.error('Admin lockout email failed:', err.message));
      }

      await admin.save();

      await logAudit({ req, userId: admin.id, userRole: admin.role || 'Admin', action: 'LOGIN', status: 'FAILED', details: `Failed admin login attempt. Current count: ${admin.failedLoginAttempts}` });

      res.status(401).json({ message: lockoutMsg });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error during admin login', error: error.message });
  }
};

// @desc    Get admin profile
// @route   GET /api/admin/profile
// @access  Private
const getAdminProfile = async (req, res) => {
  try {
    const admin = await Admin.findByPk(req.user.id);

    if (admin) {
      res.json({
        id: admin.id,
        _id: admin.id,
        username: admin.username,
        email: admin.email,
        profileImage: admin.profileImage,
        role: 'Admin',
        createdAt: admin.createdAt,
        updatedAt: admin.updatedAt,
      });
    } else {
      res.status(404).json({ message: 'Admin not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error retrieving admin profile', error: error.message });
  }
};

// @desc    Update admin profile details
// @route   PUT /api/admin/profile
// @access  Private/Admin
const updateAdminProfile = async (req, res) => {
  try {
    const { username, email } = req.body;
    const admin = await Admin.findByPk(req.user.id);

    if (!admin) {
      return res.status(404).json({ message: 'Admin profile not found' });
    }

    if (username) admin.username = username.trim();
    if (email) admin.email = email.trim().toLowerCase();

    await admin.save();

    await logAudit({ req, userId: admin.id, userRole: 'Admin', action: 'PROFILE_UPDATE', details: `Admin profile details updated` });

    res.json({
      _id: admin.id,
      username: admin.username,
      email: admin.email,
      role: 'Admin',
      message: 'Admin profile updated successfully',
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error updating admin profile', error: error.message });
  }
};

// @desc    Change admin password
// @route   PUT /api/admin/change-password
// @access  Private/Admin
const changeAdminPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const admin = await Admin.findByPk(req.user.id);

    if (!admin) {
      return res.status(404).json({ message: 'Admin profile not found' });
    }

    if (!(await admin.comparePassword(currentPassword))) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    const isStrongPassword = (pass) => {
      return pass && pass.length >= 8 && /[A-Z]/.test(pass) && /[a-z]/.test(pass) && /\d/.test(pass) && /\W/.test(pass);
    };

    if (!newPassword || !isStrongPassword(newPassword)) {
      return res.status(400).json({
        message: 'New password must be at least 8 characters long, and contain at least one uppercase letter, one lowercase letter, one number, and one special character.',
      });
    }

    // Prevent password reuse of last 5 passwords
    const bcrypt = require('bcryptjs');
    let history = [];
    try {
      history = JSON.parse(admin.passwordHistory || '[]');
    } catch (e) {
      history = [];
    }

    // Check if newPassword matches any of the stored history hashes or current password
    const matchCurrent = await admin.comparePassword(newPassword);
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
    history.unshift(admin.password);
    if (history.length > 5) {
      history = history.slice(0, 5);
    }
    admin.passwordHistory = JSON.stringify(history);

    admin.password = newPassword;
    await admin.save();

    await logAudit({ req, userId: admin.id, userRole: 'Admin', action: 'PASSWORD_CHANGE', details: `Admin password changed successfully` });

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error changing admin password', error: error.message });
  }
};

// @desc    Get database backup json (Admin only)
// @route   GET /api/admin/backup
// @access  Private/Admin
const getDatabaseBackup = async (req, res) => {
  try {
    const models = require('../models');
    
    const students = await models.Student.findAll();
    const admins = await models.Admin.findAll();
    const events = await models.Event.findAll();
    const registrations = await models.Registration.findAll();
    const attendances = await models.Attendance.findAll();
    const volunteers = await models.Volunteer.findAll();
    const volunteerTasks = await models.VolunteerTask.findAll();
    const certificates = await models.Certificate.findAll();
    const notifications = await models.Notification.findAll();
    const auditLogs = await models.AuditLog.findAll();
    const eventGalleries = await models.EventGallery.findAll();

    const backupData = {
      backupDate: new Date(),
      students,
      admins,
      events,
      registrations,
      attendances,
      volunteers,
      volunteerTasks,
      certificates,
      notifications,
      auditLogs,
      eventGalleries,
    };

    await logAudit({ req, userId: req.user.id, userRole: 'Admin', action: 'DB_BACKUP', details: 'Database backup downloaded successfully' });

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=svec_backup_${Date.now()}.json`);
    res.json(backupData);
  } catch (error) {
    res.status(500).json({ message: 'Server error generating database backup', error: error.message });
  }
};

// @desc    Get all students list
// @route   GET /api/admin/students
// @access  Private/Admin
const getStudentsList = async (req, res) => {
  try {
    const { Student } = require('../models');
    const students = await Student.findAll({
      attributes: ['id', 'fullName', 'email', 'rollNumber', 'department', 'year', 'isVerified', 'createdAt'],
      order: [['createdAt', 'DESC']],
    });
    res.json(students);
  } catch (error) {
    res.status(500).json({ message: 'Server error retrieving students list', error: error.message });
  }
};

module.exports = {
  loginAdmin,
  getAdminProfile,
  updateAdminProfile,
  changeAdminPassword,
  getDatabaseBackup,
  getStudentsList,
};
