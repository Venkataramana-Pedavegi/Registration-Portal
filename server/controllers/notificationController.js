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

// @desc    Get unread notifications count
// @route   GET /api/notifications/unread-count
// @access  Private
const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role || (req.user.username ? 'Admin' : 'Student');
    const count = await Notification.count({
      where: { userId, userRole, isRead: false },
    });
    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: 'Server error retrieving unread count', error: error.message });
  }
};

// @desc    Mark a single notification as read by ID
// @route   PATCH /api/notifications/:id/read
// @access  Private
const markReadById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role || (req.user.username ? 'Admin' : 'Student');

    const notification = await Notification.findOne({
      where: { id, userId, userRole },
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    notification.isRead = true;
    await notification.save();

    // Emit live notification:read event
    const { getIO } = require('../utils/socket');
    const io = getIO();
    if (io) {
      io.to(`user_${userId}`).emit('notification:read', { id: notification.id });
    }

    res.json({ message: 'Notification marked as read', notification });
  } catch (error) {
    res.status(500).json({ message: 'Server error marking notification read', error: error.message });
  }
};

// @desc    Mark all notifications as read
// @route   PATCH /api/notifications/read-all
// @access  Private
const markAllRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role || (req.user.username ? 'Admin' : 'Student');

    await Notification.update(
      { isRead: true },
      { where: { userId, userRole, isRead: false } }
    );

    // Emit live notification:read event
    const { getIO } = require('../utils/socket');
    const io = getIO();
    if (io) {
      io.to(`user_${userId}`).emit('notification:read', { all: true });
    }

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ message: 'Server error marking all notifications read', error: error.message });
  }
};

// @desc    Delete a notification
// @route   DELETE /api/notifications/:id
// @access  Private
const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role || (req.user.username ? 'Admin' : 'Student');

    const notification = await Notification.findOne({
      where: { id, userId, userRole },
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    await notification.destroy();
    res.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error deleting notification', error: error.message });
  }
};

// @desc    Clear all notifications
// @route   DELETE /api/notifications
// @access  Private
const clearAllNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role || (req.user.username ? 'Admin' : 'Student');

    await Notification.destroy({
      where: { userId, userRole },
    });

    res.json({ message: 'All notifications cleared successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error clearing notifications', error: error.message });
  }
};

// Backward compatible endpoint function
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
  getUnreadCount,
  markReadById,
  markAllRead,
  deleteNotification,
  clearAllNotifications,
  markNotificationRead,
};
