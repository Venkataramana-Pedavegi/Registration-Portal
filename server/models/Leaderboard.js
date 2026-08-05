const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Leaderboard = sequelize.define('Leaderboard', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  studentId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
  },
  points: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  eventsAttended: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  volunteerHours: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  badges: {
    type: DataTypes.JSON,
    defaultValue: [],
  },
});

module.exports = Leaderboard;
