const express = require('express');
const router = express.Router();
const {
  loginAdmin,
  getAdminProfile,
  updateAdminProfile,
  changeAdminPassword,
  getDatabaseBackup,
  getStudentsList,
} = require('../controllers/adminController');
const {
  getAdminDashboard,
  getAdminAnalytics,
  getAdminReports,
  getStudentProfile,
} = require('../controllers/analyticsController');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const { validateAdminLogin } = require('../middleware/validation');
const { authRateLimiter } = require('../middleware/security');
const { getAdminRegistrationStats } = require('../controllers/registrationController');

router.post('/login', authRateLimiter, validateAdminLogin, loginAdmin);

// Protected Admin Routes
router.use(protect);
router.use(adminOnly);

router.get('/profile', getAdminProfile);
router.put('/profile', updateAdminProfile);
router.put('/change-password', changeAdminPassword);

router.get('/students', getStudentsList);
router.get('/registrations', getAdminRegistrationStats);
router.get('/dashboard', getAdminDashboard);
router.get('/analytics', getAdminAnalytics);
router.get('/reports', getAdminReports);
router.get('/backup', getDatabaseBackup);
router.get('/student/:id/profile', getStudentProfile);

module.exports = router;
