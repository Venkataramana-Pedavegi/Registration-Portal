const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Certificate = sequelize.define(
  'Certificate',
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
    },
    studentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    eventId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    certificateId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    issueDate: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    pdfUrl: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    qrVerificationCode: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    indexes: [
      { fields: ['certificateId'] },
      { fields: ['studentId'] },
      { fields: ['eventId'] },
    ],
  }
);

module.exports = Certificate;
