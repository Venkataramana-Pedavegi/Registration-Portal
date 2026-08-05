const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const StudentBadge = sequelize.define('StudentBadge', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  studentId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  badgeId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  earnedDate: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
});

module.exports = StudentBadge;
