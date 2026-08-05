const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Notification = sequelize.define(
  'Notification',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    userRole: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'Student',
      validate: {
        isIn: [['Student', 'Admin']],
      },
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'System',
      validate: {
        isIn: [['Event', 'Registration', 'Certificate', 'System', 'Attendance', 'Badge', 'Announcement']],
      },
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    referenceId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    hooks: {
      afterCreate: async (notification, options) => {
        try {
          const { getIO } = require('../utils/socket');
          const io = getIO();
          if (io) {
            const plain = notification.toJSON();
            plain._id = plain.id;
            io.to(`user_${notification.userId}`).emit('notificationCreated', plain);
            io.to(`user_${notification.userId}`).emit('notification:new', plain);
            if (notification.userRole === 'Admin') {
              io.to('admin-dashboard').emit('notificationCreated', plain);
              io.to('admin-dashboard').emit('notification:new', plain);
            }
          }
        } catch (err) {
          console.error('Error in Notification afterCreate hook:', err.message);
        }
      },
    },
    indexes: [
      { fields: ['userId', 'userRole'] },
      { fields: ['isRead'] },
    ],
  }
);

module.exports = Notification;
