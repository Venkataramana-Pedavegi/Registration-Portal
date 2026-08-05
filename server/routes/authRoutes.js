const express = require('express');
const router = express.Router();
const { forgotPassword, verifyOTP, resetPassword, refreshTokens, logoutUser } = require('../controllers/passwordResetController');
const { protect } = require('../middleware/authMiddleware');
const { authRateLimiter, forgotPasswordRateLimiter } = require('../middleware/security');

router.post('/forgot-password', forgotPasswordRateLimiter, forgotPassword);
router.post('/verify-otp', authRateLimiter, verifyOTP);
router.post('/reset-password', authRateLimiter, resetPassword);
router.post('/refresh', refreshTokens);
router.post('/logout', protect, logoutUser);

module.exports = router;
