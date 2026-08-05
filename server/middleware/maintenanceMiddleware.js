const { SystemSetting } = require('../models');
const jwt = require('jsonwebtoken');

const checkMaintenanceMode = async (req, res, next) => {
  try {
    const maintenanceSetting = await SystemSetting.findByPk('maintenanceMode');
    if (maintenanceSetting && maintenanceSetting.value === 'true') {
      let isAdmin = false;

      if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
          const token = req.headers.authorization.split(' ')[1];
          const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_for_dev_only');
          const adminRoles = ['Admin', 'Super Admin', 'Event Coordinator', 'Faculty Coordinator', 'Coordinator', 'Volunteer Coordinator'];
          if (adminRoles.includes(decoded.role)) {
            isAdmin = true;
          }
        } catch (e) {
          // Token invalid or expired, ignore
        }
      }

      // Allow logout and admin panel operations to bypass maintenance mode
      const isBypass = req.path.startsWith('/api/admin') || req.path === '/api/auth/logout' || isAdmin;
      if (!isBypass) {
        return res.status(503).json({
          status: 'MAINTENANCE',
          message: 'System is currently under maintenance. Please try again later.',
        });
      }
    }
  } catch (err) {
    console.error('Maintenance mode check failed:', err.message);
  }
  next();
};

module.exports = checkMaintenanceMode;
