const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AIInsight = sequelize.define('AIInsight', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  metricName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  insightText: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  type: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'neutral', // 'alert', 'success', 'neutral'
  },
});

module.exports = AIInsight;
