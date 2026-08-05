const express = require('express');
const router = express.Router();
const {
  joinWaitlist,
  getWaitlistPosition,
  cancelWaitlist,
  getEventWaitlist,
  getMyWaitlists,
} = require('../controllers/waitlistController');
const { protect, adminOnly, studentOnly } = require('../middleware/authMiddleware');

router.post('/join', protect, studentOnly, joinWaitlist);
router.get('/my', protect, studentOnly, getMyWaitlists);
router.get('/position/:eventId', protect, studentOnly, getWaitlistPosition);
router.delete('/cancel/:id', protect, studentOnly, cancelWaitlist);
router.get('/event/:eventId', protect, adminOnly, getEventWaitlist);

module.exports = router;
