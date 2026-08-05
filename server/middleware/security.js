const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');

// General API Rate Limiter
const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Too many requests, please try again after 15 minutes.',
  },
});

// Sensitive Auth routes Rate Limiter (Login, Forgot Password, Verify OTP)
const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit to 10 attempts
  standardHeaders: true,
  legacyHeaders: false,
  statusCode: 429,
  message: {
    message: 'Too many authentication or OTP attempts. Please try again after 15 minutes.',
  },
});

// Registration Rate Limiter to block bot registration floods
const registerRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Limit to 5 registrations per hour per IP
  standardHeaders: true,
  legacyHeaders: false,
  statusCode: 429,
  message: {
    message: 'Too many registrations from this IP. Please try again after an hour.',
  },
});

// Helmet Configuration
const configureHelmet = () => {
  return helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:", "http:"],
        connectSrc: ["'self'", "ws:", "wss:", "http:", "https:"],
      },
    },
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    referrerPolicy: { policy: 'no-referrer' },
    xssFilter: true, // Deprecated but still useful for older browsers
    noSniff: true,
    hidePoweredBy: true,
  });
};

// Input XSS Sanitizer Middleware
const sanitizeXSS = (req, res, next) => {
  const sanitize = (val) => {
    if (typeof val === 'string') {
      return val
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
    }
    if (typeof val === 'object' && val !== null) {
      for (const key in val) {
        val[key] = sanitize(val[key]);
      }
    }
    return val;
  };
  if (req.body) req.body = sanitize(req.body);
  if (req.query) req.query = sanitize(req.query);
  next();
};

// Rate limit forgot password requests (Max 5 requests per hour)
const forgotPasswordRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  statusCode: 429,
  message: {
    message: 'Too many password reset requests from this IP. Please try again after an hour.',
  },
});

module.exports = {
  apiRateLimiter,
  authRateLimiter,
  registerRateLimiter,
  forgotPasswordRateLimiter,
  configureHelmet,
  sanitizeXSS,
  compression,
};
