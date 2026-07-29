const jwt = require('jsonwebtoken');
const { Student, Admin } = require('../models');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_for_dev_only');

      // Get user from the token payload using Sequelize findByPk
      if (decoded.role === 'Admin') {
        req.user = await Admin.findByPk(decoded.id, {
          attributes: { exclude: ['password'] },
        });
        req.role = 'Admin';
      } else {
        req.user = await Student.findByPk(decoded.id, {
          attributes: { exclude: ['password'] },
        });
        req.role = 'Student';
      }

      if (!req.user) {
        return res.status(401).json({ message: 'Not authorized, user not found' });
      }

      // Convert Sequelize model instance to plain object to attach custom JSON attributes if needed
      // but keeping it as model instance is fine too, let's keep it as instance.
      next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Token expired' });
      }
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token provided' });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user && req.role === 'Admin') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied: Admins only' });
  }
};

const studentOnly = (req, res, next) => {
  if (req.user && req.role === 'Student') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied: Students only' });
  }
};

module.exports = { protect, adminOnly, studentOnly };
