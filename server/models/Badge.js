const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Badge = sequelize.define('Badge', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  icon: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  ruleType: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isIn: [['events_attended', 'volunteer_tasks', 'points', 'certificates', 'competition_wins', 'first_event', 'custom']],
    },
  },
  ruleValue: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
  },
  isCustom: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
});

module.exports = Badge;
