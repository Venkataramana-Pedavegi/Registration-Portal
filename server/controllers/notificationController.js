const { Notification } = require('../models');

// @desc    Get user notifications with pagination & unread count
// @route   GET /api/notifications
// @access  Private
const getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role || (req.user.username ? 'Admin' : 'Student');
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const offset = (page - 1) * limit;

    const { count, rows } = await Notification.findAndCountAll({
      where: { userId, userRole },
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });

    const unreadCount = await Notification.count({
      where: { userId, userRole, isRead: false },
    });

    res.json({
      notifications: rows.map((n) => {
        const plain = n.toJSON();
        plain._id = plain.id;
        return plain;
      }),
      pagination: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit),
      },
      unreadCount,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error retrieving notifications', error: error.message });
  }
};

// @desc    Mark a notification as read
// @route   PUT /api/notifications/read
// @access  Private
const markNotificationRead = async (req, res) => {
  try {
    const { notificationId } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role || (req.user.username ? 'Admin' : 'Student');

    if (notificationId) {
      const notification = await Notification.findOne({
        where: { id: notificationId, userId, userRole },
      });
      if (notification) {
        notification.isRead = true;
        await notification.save();
      }
    } else {
      // Mark all as read if notificationId is omitted
      await Notification.update(
        { isRead: true },
        { where: { userId, userRole, isRead: false } }
      );
    }

    res.json({ message: 'Notification(s) marked as read' });
  } catch (error) {
    res.status(500).json({ message: 'Server error marking notification read', error: error.message });
  }
};

module.exports = {
  getNotifications,
  markNotificationRead,
};
