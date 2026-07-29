const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

// Helper to generate token
const generateToken = (id, role) => {
  return jwt.sign(
    { id, role },
    process.env.JWT_SECRET || 'fallback_secret_for_dev_only',
    { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
  );
};

// @desc    Auth admin & get token
// @route   POST /api/admin/login
// @access  Public
const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const admin = await Admin.findOne({ email: email.toLowerCase() });

    if (admin && (await admin.comparePassword(password))) {
      res.json({
        _id: admin._id,
        username: admin.username,
        email: admin.email,
        role: 'Admin',
        token: generateToken(admin._id, 'Admin'),
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
    const admin = await Admin.findById(req.user._id);

    if (admin) {
      res.json({
        _id: admin._id,
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

module.exports = {
  loginAdmin,
  getAdminProfile,
};
