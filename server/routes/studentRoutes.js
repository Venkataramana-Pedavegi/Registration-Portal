const express = require('express');
const router = express.Router();
const {
  registerStudent,
  loginStudent,
  getStudentProfile,
} = require('../controllers/studentController');
const { getStudentProfile: getStudentProfileForAdmin } = require('../controllers/analyticsController');
const { protect, studentOnly, adminOnly } = require('../middleware/authMiddleware');
const { validateRegister, validateStudentLogin } = require('../middleware/validation');

router.post('/register', validateRegister, registerStudent);
router.post('/login', validateStudentLogin, loginStudent);
router.get('/profile', protect, studentOnly, getStudentProfile);
router.get('/:id/profile', protect, adminOnly, getStudentProfileForAdmin);

module.exports = router;
