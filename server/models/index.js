const sequelize = require('../config/database');
const Student = require('./Student');
const Admin = require('./Admin');
const Event = require('./Event');
const Registration = require('./Registration');

// Define relationships
Admin.hasMany(Event, { foreignKey: 'createdBy', onDelete: 'CASCADE' });
Event.belongsTo(Admin, { foreignKey: 'createdBy' });

// Registration Relationships
Student.hasMany(Registration, { foreignKey: 'studentId', onDelete: 'CASCADE' });
Registration.belongsTo(Student, { foreignKey: 'studentId' });

Event.hasMany(Registration, { foreignKey: 'eventId', onDelete: 'CASCADE' });
Registration.belongsTo(Event, { foreignKey: 'eventId' });

module.exports = {
  sequelize,
  Student,
  Admin,
  Event,
  Registration,
};
