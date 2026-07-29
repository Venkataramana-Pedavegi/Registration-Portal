const express = require('express');
const router = express.Router();
const {
  registerStudent,
  loginStudent,
  getStudentProfile,
} = require('../controllers/studentController');
const { protect, studentOnly } = require('../middleware/authMiddleware');
const { validateRegister, validateStudentLogin } = require('../middleware/validation');

router.post('/register', validateRegister, registerStudent);
router.post('/login', validateStudentLogin, loginStudent);
router.get('/profile', protect, studentOnly, getStudentProfile);

module.exports = router;
