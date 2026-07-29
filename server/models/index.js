const sequelize = require('../config/database');
const Student = require('./Student');
const Admin = require('./Admin');
const Event = require('./Event');

// Define relationships
Admin.hasMany(Event, { foreignKey: 'createdBy', onDelete: 'CASCADE' });
Event.belongsTo(Admin, { foreignKey: 'createdBy' });

module.exports = {
  sequelize,
  Student,
  Admin,
  Event,
};
