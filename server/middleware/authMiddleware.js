const jwt = require('jsonwebtoken');
const { Student, Admin } = require('../models');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      
      const { TokenBlacklist } = require('../models');
      const isBlacklisted = await TokenBlacklist.findByPk(token);
      if (isBlacklisted) {
        return res.status(401).json({ message: 'Session invalidated, please log in again.' });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_for_dev_only');

      const adminRoles = ['Admin', 'Super Admin', 'Event Coordinator', 'Faculty Coordinator', 'Coordinator', 'Volunteer Coordinator'];

      if (adminRoles.includes(decoded.role)) {
        req.user = await Admin.findByPk(decoded.id, {
          attributes: { exclude: ['password'] },
        });
        req.role = req.user?.role || decoded.role || 'Admin';
      } else {
        req.user = await Student.findByPk(decoded.id, {
          attributes: { exclude: ['password'] },
        });
        req.role = req.user?.role || decoded.role || 'Student';
      }

      if (!req.user) {
        return res.status(401).json({ message: 'Not authorized, user not found' });
      }

      // Check if user is active
      if (req.user.isActive === false) {
        return res.status(403).json({ message: 'Not authorized, account is deactivated' });
      }

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
  const allowedAdminRoles = ['Admin', 'Super Admin', 'Event Coordinator', 'Faculty Coordinator', 'Coordinator', 'Volunteer Coordinator'];
  if (req.user && allowedAdminRoles.includes(req.role)) {
    next();
  } else {
    res.status(403).json({ message: 'Access denied: Admins only' });
  }
};

const studentOnly = (req, res, next) => {
  const studentRoles = ['Student', 'Volunteer'];
  if (req.user && (studentRoles.includes(req.role) || !req.role)) {
    next();
  } else {
    res.status(403).json({ message: 'Access denied: Students only' });
  }
};

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.role)) {
      return res.status(403).json({ message: `Role '${req.role}' is not authorized to access this resource` });
    }
    next();
  };
};

const checkPermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    if (req.role === 'Super Admin') {
      return next();
    }

    let permissions = [];
    try {
      permissions = typeof req.user.permissions === 'string'
        ? JSON.parse(req.user.permissions)
        : (req.user.permissions || []);
    } catch (e) {
      permissions = [];
    }

    if (permissions.includes(permission)) {
      return next();
    }

    return res.status(403).json({ message: `Access denied: Requires '${permission}' permission` });
  };
};

const adminOrVolunteer = async (req, res, next) => {
  const allowedAdminRoles = ['Admin', 'Super Admin', 'Event Coordinator', 'Faculty Coordinator', 'Coordinator', 'Volunteer Coordinator'];
  if (req.user && allowedAdminRoles.includes(req.role)) {
    return next();
  }

  if (req.user && (req.role === 'Student' || !req.role)) {
    const { Volunteer } = require('../models');
    const { Op } = require('sequelize');
    const approvedVolunteer = await Volunteer.findOne({
      where: { studentId: req.user.id, status: { [Op.in]: ['approved', 'Approved'] } }
    });

    if (approvedVolunteer) {
      return next();
    }
  }

  return res.status(403).json({ message: 'Access denied: Entry Verification requires Admin or Approved Volunteer privileges' });
};

module.exports = { protect, adminOnly, studentOnly, authorizeRoles, checkPermission, adminOrVolunteer };
