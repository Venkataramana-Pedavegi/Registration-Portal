const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AIRecommendation = sequelize.define('AIRecommendation', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  studentId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  eventId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  confidenceScore: {
    type: DataTypes.INTEGER,
    defaultValue: 75,
  },
  reason: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
});

module.exports = AIRecommendation;
