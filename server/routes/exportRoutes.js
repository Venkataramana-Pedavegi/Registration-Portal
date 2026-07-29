const express = require('express');
const router = express.Router();
const {
  exportEvents,
  exportParticipants,
  exportAttendance,
} = require('../controllers/exportController');
const { protect } = require('../middleware/authMiddleware');
const { adminProtect } = require('../middleware/adminMiddleware');

router.use(protect);
router.use(adminProtect);

router.get('/events', exportEvents);
router.get('/participants', exportParticipants);
router.get('/attendance', exportAttendance);

module.exports = router;
