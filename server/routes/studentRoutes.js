const express = require('express');
const router = express.Router();
const {
  registerStudent,
  loginStudent,
  getStudentProfile,
  verifyStudentEmail,
  resendVerification,
} = require('../controllers/studentController');
const { getStudentProfile: getStudentProfileForAdmin } = require('../controllers/analyticsController');
const { protect, studentOnly, adminOnly } = require('../middleware/authMiddleware');
const { validateRegister, validateStudentLogin } = require('../middleware/validation');
const { registerRateLimiter, authRateLimiter } = require('../middleware/security');

router.post('/register', registerRateLimiter, validateRegister, registerStudent);
router.get('/verify/:token', verifyStudentEmail);
router.get('/verify-email/:token', verifyStudentEmail);
router.post('/resend-verification', authRateLimiter, resendVerification);
router.post('/login', authRateLimiter, validateStudentLogin, loginStudent);
router.get('/profile', protect, studentOnly, getStudentProfile);
router.get('/:id/profile', protect, adminOnly, getStudentProfileForAdmin);

module.exports = router;
