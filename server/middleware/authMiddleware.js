const jwt = require('jsonwebtoken');
const Student = require('../models/Student');
const Admin = require('../models/Admin');

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

      // Get user from the token payload
      if (decoded.role === 'Admin') {
        req.user = await Admin.findById(decoded.id).select('-password');
        req.role = 'Admin';
      } else {
        req.user = await Student.findById(decoded.id).select('-password');
        req.role = 'Student';
      }

      if (!req.user) {
        return res.status(401).json({ message: 'Not authorized, user not found' });
      }

      next();
    } catch (error) {
      console.error(error);
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
