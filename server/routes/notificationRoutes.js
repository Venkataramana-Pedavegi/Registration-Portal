const express = require('express');
const router = express.Router();
const {
  getNotifications,
  getUnreadCount,
  markReadById,
  markAllRead,
  deleteNotification,
  clearAllNotifications,
  markNotificationRead,
} = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', getNotifications);
router.get('/unread-count', getUnreadCount);
router.patch('/:id/read', markReadById);
router.patch('/read-all', markAllRead);
router.delete('/:id', deleteNotification);
router.delete('/', clearAllNotifications);

// Keep PUT /read for backward compatibility
router.put('/read', markNotificationRead);

module.exports = router;
