const { Admin, Student, SystemSetting, Registration, Event, Attendance, Certificate, LoginHistory, AuditLog } = require('../models');
const { logAudit } = require('../middleware/auditLogger');
const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');

// -------------------------------------------------------------
// ADMIN MANAGEMENT APIs
// -------------------------------------------------------------

// Get list of admins with search and pagination
const getAllAdmins = async (req, res) => {
  try {
    const { search, role, department, page = 1, limit = 10 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const whereClause = {};

    if (role) whereClause.role = role;
    if (department) whereClause.department = department;

    if (search) {
      whereClause[Op.or] = [
        { username: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
      ];
    }

    const { count, rows } = await Admin.findAndCountAll({
      where: whereClause,
      attributes: { exclude: ['password'] },
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset,
    });

    res.json({
      admins: rows,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      totalAdmins: count,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error retrieving administrators', error: error.message });
  }
};

// Create admin user
const createAdmin = async (req, res) => {
  try {
    const { username, email, password, role, department, permissions } = req.body;

    const existing = await Admin.findOne({ where: { email: email.toLowerCase().trim() } });
    if (existing) {
      return res.status(400).json({ message: 'Email address already exists' });
    }

    const newAdmin = await Admin.create({
      username: username.trim(),
      email: email.trim().toLowerCase(),
      password,
      role: role || 'Admin',
      department: department || null,
      permissions: typeof permissions === 'object' ? JSON.stringify(permissions) : (permissions || '[]'),
      isActive: true,
    });

    await logAudit({ req, userId: req.user.id, userRole: req.role || 'Admin', action: 'ADMIN_CREATION', details: `Created administrator ${newAdmin.username} (Role: ${newAdmin.role})` });

    const response = newAdmin.toJSON();
    delete response.password;
    res.status(201).json(response);
  } catch (error) {
    res.status(500).json({ message: 'Server error creating administrator', error: error.message });
  }
};

// Update admin details
const updateAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email, role, department, permissions } = req.body;

    const admin = await Admin.findByPk(id);
    if (!admin) {
      return res.status(404).json({ message: 'Administrator not found' });
    }

    // Check if modifying own role to avoid lockout/demotion
    if (admin.id === req.user.id && role && role !== admin.role) {
      return res.status(400).json({ message: 'You cannot change your own role.' });
    }

    if (username) admin.username = username.trim();
    if (email) admin.email = email.trim().toLowerCase();
    if (role) admin.role = role;
    if (department !== undefined) admin.department = department || null;
    if (permissions !== undefined) {
      admin.permissions = typeof permissions === 'object' ? JSON.stringify(permissions) : permissions;
    }

    await admin.save();

    await logAudit({ req, userId: req.user.id, userRole: req.role || 'Admin', action: 'ADMIN_UPDATE', details: `Updated administrator ${admin.username} settings` });

    const response = admin.toJSON();
    delete response.password;
    res.json(response);
  } catch (error) {
    res.status(500).json({ message: 'Server error updating administrator', error: error.message });
  }
};

// Delete admin user
const deleteAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ message: 'You cannot delete yourself.' });
    }

    const admin = await Admin.findByPk(id);
    if (!admin) {
      return res.status(404).json({ message: 'Administrator not found' });
    }

    await admin.destroy();

    await logAudit({ req, userId: req.user.id, userRole: req.role || 'Admin', action: 'ADMIN_DELETION', details: `Deleted administrator ${admin.username}` });

    res.json({ message: 'Administrator deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error deleting administrator', error: error.message });
  }
};

// Toggle Admin Account Status
const toggleAdminActive = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ message: 'You cannot deactivate your own account.' });
    }

    const admin = await Admin.findByPk(id);
    if (!admin) {
      return res.status(404).json({ message: 'Administrator not found' });
    }

    admin.isActive = !!isActive;
    await admin.save();

    const actionText = admin.isActive ? 'activated' : 'deactivated';
    await logAudit({ req, userId: req.user.id, userRole: req.role || 'Admin', action: 'ADMIN_TOGGLE_ACTIVE', details: `Admin ${admin.username} was ${actionText}` });

    res.json({ message: `Administrator successfully ${actionText}`, isActive: admin.isActive });
  } catch (error) {
    res.status(500).json({ message: 'Server error toggling administrator status', error: error.message });
  }
};

// Reset Admin Password
const resetAdminPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    const admin = await Admin.findByPk(id);
    if (!admin) {
      return res.status(404).json({ message: 'Administrator not found' });
    }

    admin.password = password;
    await admin.save();

    await logAudit({ req, userId: req.user.id, userRole: req.role || 'Admin', action: 'ADMIN_PASSWORD_RESET', details: `Admin ${admin.username} password was reset by Super Admin` });

    res.json({ message: 'Administrator password reset successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error resetting password', error: error.message });
  }
};

// -------------------------------------------------------------
// STUDENT MANAGEMENT APIs
// -------------------------------------------------------------

// Get list of students with advanced search, pagination, and filters
const getAllStudents = async (req, res) => {
  try {
    const { search, department, year, isActive, page = 1, limit = 10 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const whereClause = {};

    if (department) whereClause.department = department;
    if (year) whereClause.year = year;
    if (isActive !== undefined && isActive !== '') {
      whereClause.isActive = isActive === 'true' || isActive === '1';
    }

    if (search) {
      whereClause[Op.or] = [
        { fullName: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { rollNumber: { [Op.like]: `%${search}%` } },
      ];
    }

    const { count, rows } = await Student.findAndCountAll({
      where: whereClause,
      attributes: { exclude: ['password'] },
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset,
    });

    res.json({
      students: rows,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      totalStudents: count,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error retrieving students list', error: error.message });
  }
};

// Update student profile details (Admin view)
const updateStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const { fullName, rollNumber, email, department, year, isVerified } = req.body;

    const student = await Student.findByPk(id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    if (fullName) student.fullName = fullName.trim();
    if (rollNumber) student.rollNumber = rollNumber.trim().toUpperCase();
    if (email) student.email = email.trim().toLowerCase();
    if (department) student.department = department;
    if (year) student.year = year;
    if (isVerified !== undefined) student.isVerified = !!isVerified;

    await student.save();

    await logAudit({ req, userId: req.user.id, userRole: req.role || 'Admin', action: 'STUDENT_UPDATE', details: `Updated profile details for student ${student.fullName} (Roll: ${student.rollNumber})` });

    const response = student.toJSON();
    delete response.password;
    res.json(response);
  } catch (error) {
    res.status(500).json({ message: 'Server error updating student profile', error: error.message });
  }
};

// Toggle Student active status
const toggleStudentActive = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const student = await Student.findByPk(id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    student.isActive = !!isActive;
    if (student.isActive) {
      student.isVerified = true;
    }
    await student.save();

    const actionText = student.isActive ? 'activated' : 'deactivated';
    await logAudit({ req, userId: req.user.id, userRole: req.role || 'Admin', action: 'STUDENT_TOGGLE_ACTIVE', details: `Student account ${student.fullName} was ${actionText}` });

    res.json({ message: `Student account successfully ${actionText}`, isActive: student.isActive });
  } catch (error) {
    res.status(500).json({ message: 'Server error toggling student status', error: error.message });
  }
};

// Get comprehensive student profile details for admin view
const getStudentDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const student = await Student.findByPk(id, {
      attributes: { exclude: ['password'] },
    });
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    let registrations = [];
    try {
      registrations = await Registration.findAll({
        where: { studentId: id },
        include: [
          { model: Event, attributes: ['id', 'title', 'eventDate', 'venue'] },
          { model: Attendance, attributes: ['id', 'attendanceStatus', 'markedAt'] },
        ],
        order: [['registrationDate', 'DESC']],
      });
    } catch (regErr) {
      console.error('Error fetching student registrations:', regErr.message);
    }

    let certificates = [];
    try {
      certificates = await Certificate.findAll({
        where: { studentId: id },
        include: [{ model: Event, attributes: ['id', 'title'] }],
        order: [['issueDate', 'DESC']],
      });
    } catch (certErr) {
      console.error('Error fetching student certificates:', certErr.message);
    }

    let loginHistory = [];
    try {
      loginHistory = await AuditLog.findAll({
        where: { userId: id, action: { [Op.like]: '%LOGIN%' } },
        order: [['createdAt', 'DESC']],
        limit: 15,
      });
    } catch (lhErr) {
      console.error('Error fetching student login history:', lhErr.message);
    }

    let achievements = [];
    try {
      achievements = await AuditLog.findAll({
        where: { userId: id, action: { [Op.like]: '%BADGE%' } },
        order: [['createdAt', 'DESC']],
        limit: 15,
      });
    } catch (achErr) {
      console.error('Error fetching student achievements:', achErr.message);
    }

    res.json({
      student,
      registrations,
      certificates,
      loginHistory,
      achievements,
    });
  } catch (error) {
    console.error('Error in getStudentDetails:', error.message);
    res.status(500).json({ message: 'Server error retrieving student details', error: error.message });
  }
};

// -------------------------------------------------------------
// SYSTEM SETTINGS APIs
// -------------------------------------------------------------

// Fetch system settings
const getSystemSettings = async (req, res) => {
  try {
    const settings = await SystemSetting.findAll();
    const settingsMap = {};
    settings.forEach((s) => {
      settingsMap[s.key] = s.value;
    });
    res.json(settingsMap);
  } catch (error) {
    res.status(500).json({ message: 'Server error retrieving settings', error: error.message });
  }
};

// Update system settings
const updateSystemSettings = async (req, res) => {
  try {
    const updates = req.body; // Expects dictionary: { key: value }

    for (const [key, value] of Object.entries(updates)) {
      const setting = await SystemSetting.findByPk(key);
      if (setting) {
        setting.value = typeof value === 'object' ? JSON.stringify(value) : String(value);
        await setting.save();
      } else {
        await SystemSetting.create({
          key,
          value: typeof value === 'object' ? JSON.stringify(value) : String(value),
        });
      }
    }

    const sendEmail = require('../utils/sendEmail');
    if (sendEmail && sendEmail.clearEmailSettingsCache) {
      sendEmail.clearEmailSettingsCache();
    }

    await logAudit({ req, userId: req.user.id, userRole: req.role || 'Admin', action: 'SETTINGS_UPDATE', details: 'System configuration settings updated' });

    res.json({ message: 'System settings updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error updating settings', error: error.message });
  }
};

module.exports = {
  getAllAdmins,
  createAdmin,
  updateAdmin,
  deleteAdmin,
  toggleAdminActive,
  resetAdminPassword,
  getAllStudents,
  updateStudent,
  toggleStudentActive,
  getStudentDetails,
  getSystemSettings,
  updateSystemSettings,
};
