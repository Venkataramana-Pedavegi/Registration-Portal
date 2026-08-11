const express = require('express');
const router = express.Router();
const {
  markAttendance,
  updateAttendance,
  getEventAttendance,
  importAttendance,
} = require('../controllers/attendanceController');
const { protect } = require('../middleware/authMiddleware');
const { adminProtect } = require('../middleware/adminMiddleware');

router.use(protect);
router.use(adminProtect);

router.post('/', markAttendance);
router.post('/import', importAttendance);
router.post('/import-csv', importAttendance);
router.put('/:id', updateAttendance);
router.get('/event/:eventId', getEventAttendance);

module.exports = router;
