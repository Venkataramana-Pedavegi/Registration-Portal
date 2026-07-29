const express = require('express');
const router = express.Router();
const {
  loginAdmin,
  getAdminProfile,
} = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const { validateAdminLogin } = require('../middleware/validation');

const { getAdminRegistrationStats } = require('../controllers/registrationController');

router.post('/login', validateAdminLogin, loginAdmin);
router.get('/profile', protect, adminOnly, getAdminProfile);
router.get('/registrations', protect, adminOnly, getAdminRegistrationStats);

module.exports = router;
