const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Waitlist = sequelize.define('Waitlist', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  eventId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  studentId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  position: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'waiting',
    validate: {
      isIn: [['waiting', 'promoted', 'cancelled']],
    },
  },
});

module.exports = Waitlist;
