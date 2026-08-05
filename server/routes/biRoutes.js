const express = require('express');
const router = express.Router();
const { getBIDashboardData } = require('../controllers/biController');
const { protect, adminOnly, checkPermission } = require('../middleware/authMiddleware');

// Get all BI dashboard aggregate stats
router.get('/dashboard', protect, adminOnly, checkPermission('Analytics'), getBIDashboardData);

module.exports = router;
