const { AuditLog } = require('../models');

const parseUserAgent = (userAgentString) => {
  if (!userAgentString) return { browser: 'Unknown', os: 'Unknown' };

  let browser = 'Other';
  let os = 'Other';

  // OS Detection
  if (userAgentString.includes('Windows')) os = 'Windows';
  else if (userAgentString.includes('Macintosh') || userAgentString.includes('Mac OS')) os = 'macOS';
  else if (userAgentString.includes('Linux')) os = 'Linux';
  else if (userAgentString.includes('Android')) os = 'Android';
  else if (userAgentString.includes('like Mac OS') || userAgentString.includes('iPhone') || userAgentString.includes('iPad')) os = 'iOS';

  // Browser Detection
  if (userAgentString.includes('Firefox')) browser = 'Firefox';
  else if (userAgentString.includes('Chrome') && !userAgentString.includes('Chromium')) browser = 'Chrome';
  else if (userAgentString.includes('Safari') && !userAgentString.includes('Chrome')) browser = 'Safari';
  else if (userAgentString.includes('Edge') || userAgentString.includes('Edg')) browser = 'Edge';
  else if (userAgentString.includes('MSIE') || userAgentString.includes('Trident')) browser = 'Internet Explorer';

  return { browser, os };
};

const logAudit = async ({ req, userId, userRole, action, resource, status, details }) => {
  try {
    const ipAddress = req 
      ? (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1').split(',')[0].trim() 
      : '127.0.0.1';
    
    const userAgentStr = req ? req.headers['user-agent'] : '';
    const { browser, os } = parseUserAgent(userAgentStr);

    await AuditLog.create({
      userId: userId || (req?.user?.id || null),
      userRole: userRole || (req?.user?.role || 'Guest'),
      action: action || 'UNKNOWN_ACTION',
      resource: resource || null,
      status: status || 'SUCCESS',
      details: typeof details === 'object' ? JSON.stringify(details) : details,
      ipAddress,
      browser,
      os,
    });
  } catch (err) {
    console.error('Audit log recording failed:', err.message);
  }
};

module.exports = { logAudit, parseUserAgent };
