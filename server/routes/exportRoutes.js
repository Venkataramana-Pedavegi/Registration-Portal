const express = require('express');
const router = express.Router();
const {
  exportEvents,
  exportParticipants,
  exportAttendance,
  exportVolunteers,
  exportAuditLogs,
} = require('../controllers/exportController');
const { protect } = require('../middleware/authMiddleware');
const { adminProtect } = require('../middleware/adminMiddleware');

router.use(protect);
router.use(adminProtect);

router.get('/events', exportEvents);
router.get('/participants', exportParticipants);
router.get('/attendance', exportAttendance);
router.get('/volunteers', exportVolunteers);
router.get('/audit-logs', exportAuditLogs);

module.exports = router;
