const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// API Rate Limiter to prevent brute force & DDoS
const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // Limit each IP to 300 requests per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Too many requests from this IP, please try again after 15 minutes.',
  },
});

// Helmet Configuration
const configureHelmet = () => {
  return helmet({
    contentSecurityPolicy: false, // Disabled for flexible inline SVGs & QR codes
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  });
};

module.exports = {
  apiRateLimiter,
  configureHelmet,
};
