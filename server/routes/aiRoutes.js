const express = require('express');
const router = express.Router();
const {
  chatWithAI,
  getEventRecommendations,
  generateEventDescription,
  analyzeEventFeedback,
  generateAIEmail,
  getAIAnalyticsInsights,
  predictEventAttendance,
  executeSmartSearch,
} = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware');

router.post('/chat', protect, chatWithAI);
router.get('/recommendations', protect, getEventRecommendations);
router.post('/generate-description', protect, generateEventDescription);
router.get('/feedback-analysis/:eventId', protect, analyzeEventFeedback);
router.post('/write-email', protect, generateAIEmail);
router.get('/insights', protect, getAIAnalyticsInsights);
router.get('/predict-attendance/:eventId', protect, predictEventAttendance);
router.get('/smart-search', protect, executeSmartSearch);

module.exports = router;
