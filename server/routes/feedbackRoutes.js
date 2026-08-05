const express = require('express');
const router = express.Router();
const {
  submitFeedback,
  editFeedback,
  getEventFeedback,
  getFeedbackAnalytics,
  getMyFeedback,
} = require('../controllers/feedbackController');
const { protect, adminOnly, studentOnly } = require('../middleware/authMiddleware');

router.post('/', protect, studentOnly, submitFeedback);
router.put('/:id', protect, studentOnly, editFeedback);
router.get('/event/:eventId', getEventFeedback);
router.get('/my', protect, studentOnly, getMyFeedback);
router.get('/admin/analytics', protect, adminOnly, getFeedbackAnalytics);

module.exports = router;
