const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AIConversation = sequelize.define('AIConversation', {
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
    defaultValue: 'Student', // 'Student' or 'Admin'
  },
  sessionId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  prompt: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  response: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
});

module.exports = AIConversation;
