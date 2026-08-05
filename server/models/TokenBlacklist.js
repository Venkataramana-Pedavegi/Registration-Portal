const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const TokenBlacklist = sequelize.define(
  'TokenBlacklist',
  {
    token: {
      type: DataTypes.STRING(512),
      primaryKey: true,
      allowNull: false,
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    tableName: 'TokenBlacklists',
    timestamps: true,
  }
);

module.exports = TokenBlacklist;
