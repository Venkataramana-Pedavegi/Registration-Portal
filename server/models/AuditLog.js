const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AuditLog = sequelize.define(
  'AuditLog',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    userRole: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    action: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    details: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    ipAddress: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: '127.0.0.1',
    },
    browser: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    os: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    resource: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: 'SUCCESS',
    },
  },
  {
    indexes: [
      { fields: ['action'] },
      { fields: ['createdAt'] },
    ],
  }
);

module.exports = AuditLog;
