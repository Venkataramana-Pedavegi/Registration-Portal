const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Registration = sequelize.define(
  'Registration',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    studentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Student ID is required' },
      },
    },
    eventId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Event ID is required' },
      },
    },
    registrationDate: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'Registered',
      validate: {
        isIn: {
          args: [['Registered', 'Cancelled', 'Completed']],
          msg: "Status must be 'Registered', 'Cancelled', or 'Completed'",
        },
      },
    },
    qrCodeUrl: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    indexes: [
      {
        unique: true,
        fields: ['studentId', 'eventId', 'status'],
        name: 'unique_student_event_registration',
      },
    ],
  }
);

module.exports = Registration;
