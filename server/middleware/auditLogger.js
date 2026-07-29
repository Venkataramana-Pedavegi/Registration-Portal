const { AuditLog } = require('../models');

const logAudit = async ({ req, userId, userRole, action, details }) => {
  try {
    const ipAddress = req ? (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1') : '127.0.0.1';
    
    await AuditLog.create({
      userId: userId || (req?.user?.id || null),
      userRole: userRole || (req?.user?.role || 'Guest'),
      action,
      details: typeof details === 'object' ? JSON.stringify(details) : details,
      ipAddress,
    });
  } catch (err) {
    console.error('Audit log recording failed:', err.message);
  }
};

module.exports = { logAudit };
