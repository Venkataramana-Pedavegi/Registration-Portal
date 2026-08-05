const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const LoginHistory = sequelize.define(
  'LoginHistory',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    userRole: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    ipAddress: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    device: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    browser: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    location: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: 'Local Campus network',
    },
  },
  {
    tableName: 'LoginHistories',
    timestamps: true,
  }
);

module.exports = LoginHistory;
