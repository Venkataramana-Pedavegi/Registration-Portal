const jwt = require('jsonwebtoken');

/**
 * Generates a JSON Web Token for the user
 * @param {string} id - User or Admin ID
 * @param {string} role - User role ('Student' or 'Admin')
 * @returns {string} Signed JWT token
 */
const generateToken = (id, role) => {
  return jwt.sign(
    { id, role },
    process.env.JWT_SECRET || 'fallback_secret_for_dev_only',
    { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
  );
};

module.exports = generateToken;
