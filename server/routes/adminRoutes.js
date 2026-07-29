const express = require('express');
const router = express.Router();
const {
  loginAdmin,
  getAdminProfile,
} = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const { validateAdminLogin } = require('../middleware/validation');

router.post('/login', validateAdminLogin, loginAdmin);
router.get('/profile', protect, adminOnly, getAdminProfile);

module.exports = router;
