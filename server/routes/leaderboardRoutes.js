const express = require('express');
const router = express.Router();
const { getLeaderboard, getStudentStats } = require('../controllers/leaderboardController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', getLeaderboard);
router.get('/my-stats', protect, getStudentStats);

module.exports = router;
