const express = require('express');
const router = express.Router();
const {
  getProfileStats,
  getTimeline,
  getStudentBadges,
  getAchievements,
  adminAdjustPoints,
  adminCreateCustomBadge,
  adminResetMonthlyRankings,
  adminGetAnalytics,
} = require('../controllers/gamificationController');
const { protect } = require('../middleware/authMiddleware');
const { adminProtect } = require('../middleware/adminMiddleware');

router.use(protect);

// Student endpoints
router.get('/profile-stats', getProfileStats);
router.get('/timeline', getTimeline);
router.get('/badges', getStudentBadges);
router.get('/achievements', getAchievements);

// Admin controls endpoints
router.post('/admin/adjust-points', adminProtect, adminAdjustPoints);
router.post('/admin/badge', adminProtect, adminCreateCustomBadge);
router.post('/admin/reset-monthly', adminProtect, adminResetMonthlyRankings);
router.get('/admin/analytics', adminProtect, adminGetAnalytics);

module.exports = router;
