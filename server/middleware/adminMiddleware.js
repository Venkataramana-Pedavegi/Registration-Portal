const jwt = require('jsonwebtoken');
const { Admin } = require('../models');

const adminProtect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_for_dev_only');

      const adminRoles = ['Admin', 'Super Admin', 'Event Coordinator', 'Faculty Coordinator', 'Coordinator', 'Volunteer Coordinator'];
      if (!adminRoles.includes(decoded.role)) {
        return res.status(403).json({ message: 'Access denied: Admins only' });
      }

      req.user = await Admin.findByPk(decoded.id, {
        attributes: { exclude: ['password'] },
      });
      req.role = decoded.role || 'Admin';

      if (!req.user) {
        return res.status(401).json({ message: 'Not authorized, admin not found' });
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

module.exports = { adminProtect };
