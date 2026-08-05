const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const EventGallery = sequelize.define('EventGallery', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  eventId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: '',
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    defaultValue: '',
  },
  mediaType: {
    type: DataTypes.ENUM('IMAGE', 'VIDEO'),
    allowNull: false,
    defaultValue: 'IMAGE',
  },
  mediaUrl: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  thumbnailUrl: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  uploadedBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  displayOrder: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  isFeatured: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  views: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  downloads: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  // Backward compatibility fields from older fests phase
  order: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0,
  },
  isHighlight: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  isWinner: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  winnerName: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  downloadUrl: {
    type: DataTypes.STRING,
    allowNull: true,
  },
});

module.exports = EventGallery;
