const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Attendance = sequelize.define(
  'Attendance',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    registrationId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: { msg: 'Registration ID is required' },
      },
    },
    eventId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Event ID is required' },
      },
    },
    studentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Student ID is required' },
      },
    },
    attendanceStatus: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'Present',
      validate: {
        isIn: {
          args: [['Present', 'Absent']],
          msg: "Attendance status must be 'Present' or 'Absent'",
        },
      },
    },
    markedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    indexes: [
      {
        unique: true,
        fields: ['registrationId'],
      },
      {
        fields: ['eventId', 'studentId'],
      },
    ],
  }
);

module.exports = Attendance;
