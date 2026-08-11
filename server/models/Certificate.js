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
    hooks: {
      afterCreate: async (certificate, options) => {
        try {
          const AdminModel = sequelize.models.Admin || require('./Admin');
          const EventModel = sequelize.models.Event || require('./Event');
          const StudentModel = sequelize.models.Student || require('./Student');
          const NotificationModel = sequelize.models.Notification || require('./Notification');

          const event = await EventModel.findByPk(certificate.eventId);
          const student = await StudentModel.findByPk(certificate.studentId);
          const adminsList = await AdminModel.findAll({ where: { isActive: true } });

          const studentName = student?.fullName || 'Student';
          const eventTitle = event?.title || 'Event';

          const adminPromises = adminsList.map(adm => {
            return NotificationModel.create({
              userId: adm.id,
              userRole: 'Admin',
              title: 'Certificates Generated',
              message: `Certificate issued to ${studentName} for ${eventTitle}.`,
              type: 'Certificate',
              referenceId: certificate.eventId,
            }).catch(err => console.error('Error creating admin certificate notification:', err.message));
          });
          await Promise.all(adminPromises);
        } catch (err) {
          console.error('Error in Certificate afterCreate hook:', err.message);
        }
      },
    },
    indexes: [
      { fields: ['certificateId'] },
      { fields: ['studentId'] },
      { fields: ['eventId'] },
    ],
  }
);

module.exports = Certificate;
