const { Admin } = require('../models');
const generateToken = require('../utils/generateToken');

// @desc    Auth admin & get token
// @route   POST /api/admin/login
// @access  Public
const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const admin = await Admin.findOne({ where: { email: email.toLowerCase() } });

    if (admin && (await admin.comparePassword(password))) {
      res.json({
        _id: admin.id,
        username: admin.username,
        email: admin.email,
        role: 'Admin',
        token: generateToken(admin.id, 'Admin'),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
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
        _id: admin.id,
        username: admin.username,
        email: admin.email,
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

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters long' });
    }

    admin.password = newPassword;
    await admin.save();

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error changing admin password', error: error.message });
  }
};

module.exports = {
  loginAdmin,
  getAdminProfile,
  updateAdminProfile,
  changeAdminPassword,
};
