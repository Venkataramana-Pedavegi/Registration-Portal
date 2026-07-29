const sequelize = require('../config/database');
const Student = require('./Student');
const Admin = require('./Admin');
const Event = require('./Event');
const Registration = require('./Registration');
const Attendance = require('./Attendance');

// Relationships
Admin.hasMany(Event, { foreignKey: 'createdBy', onDelete: 'CASCADE' });
Event.belongsTo(Admin, { foreignKey: 'createdBy' });

// Registration Relationships
Student.hasMany(Registration, { foreignKey: 'studentId', onDelete: 'CASCADE' });
Registration.belongsTo(Student, { foreignKey: 'studentId' });

Event.hasMany(Registration, { foreignKey: 'eventId', onDelete: 'CASCADE' });
Registration.belongsTo(Event, { foreignKey: 'eventId' });

// Attendance Relationships
Registration.hasOne(Attendance, { foreignKey: 'registrationId', onDelete: 'CASCADE' });
Attendance.belongsTo(Registration, { foreignKey: 'registrationId' });

Event.hasMany(Attendance, { foreignKey: 'eventId', onDelete: 'CASCADE' });
Attendance.belongsTo(Event, { foreignKey: 'eventId' });

Student.hasMany(Attendance, { foreignKey: 'studentId', onDelete: 'CASCADE' });
Attendance.belongsTo(Student, { foreignKey: 'studentId' });

module.exports = {
  sequelize,
  Student,
  Admin,
  Event,
  Registration,
  Attendance,
};
