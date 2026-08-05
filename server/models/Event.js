const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Event = sequelize.define(
  'Event',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Event title is required' },
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Event description is required' },
      },
    },
    category: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Event category is required' },
      },
    },
    venue: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Event venue is required' },
      },
    },
    eventDate: {
      type: DataTypes.DATE,
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Event date is required' },
      },
    },
    startTime: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Start time is required' },
      },
    },
    endTime: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: { msg: 'End time is required' },
      },
    },
    registrationDeadline: {
      type: DataTypes.DATE,
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Registration deadline is required' },
      },
    },
    organizer: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Organizer name is required' },
      },
    },
    capacity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        isInt: { msg: 'Capacity must be an integer' },
        min: {
          args: [1],
          msg: 'Capacity must be greater than zero',
        },
      },
    },
    availableSeats: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    image: {
      type: DataTypes.STRING,
      defaultValue: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&q=80&w=800',
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'Upcoming',
      validate: {
        isIn: {
          args: [['Upcoming', 'Ongoing', 'Completed', 'Cancelled']],
          msg: "Status must be 'Upcoming', 'Ongoing', 'Completed', or 'Cancelled'",
        },
      },
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    fee: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
    },
    isPaid: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    registrationType: {
      type: DataTypes.ENUM('FREE', 'PAID'),
      allowNull: false,
      defaultValue: 'FREE',
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00,
    },
    reminderSent24h: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    reminderSent1h: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    department: {
      type: DataTypes.STRING,
      defaultValue: 'General',
    },
  },
  {
    indexes: [
      {
        unique: true,
        fields: ['title', 'venue', 'eventDate'],
        name: 'unique_event_title_venue_date',
      },
    ],
  }
);

module.exports = Event;
