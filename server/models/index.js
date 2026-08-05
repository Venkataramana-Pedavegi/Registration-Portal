const sequelize = require('../config/database');
const Student = require('./Student');
const Admin = require('./Admin');
const Event = require('./Event');
const Registration = require('./Registration');
const Attendance = require('./Attendance');
const Notification = require('./Notification');
const Certificate = require('./Certificate');
const AuditLog = require('./AuditLog');
const LoginHistory = require('./LoginHistory');
const TokenBlacklist = require('./TokenBlacklist');

// New Enterprise Models
const Feedback = require('./Feedback');
const Waitlist = require('./Waitlist');
const Volunteer = require('./Volunteer');
const VolunteerTask = require('./VolunteerTask');
const Leaderboard = require('./Leaderboard');
const EventGallery = require('./EventGallery');
const Badge = require('./Badge');
const StudentBadge = require('./StudentBadge');
const ActivityLog = require('./ActivityLog');
const SystemSetting = require('./SystemSetting');

// Sprint 8 AI Models
const AIConversation = require('./AIConversation');
const AIRecommendation = require('./AIRecommendation');
const AIInsight = require('./AIInsight');

// Existing Relationships
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

// Certificate Relationships
Registration.hasOne(Certificate, { foreignKey: 'registrationId', onDelete: 'CASCADE' });
Certificate.belongsTo(Registration, { foreignKey: 'registrationId' });

Student.hasMany(Certificate, { foreignKey: 'studentId', onDelete: 'CASCADE' });
Certificate.belongsTo(Student, { foreignKey: 'studentId' });

Event.hasMany(Certificate, { foreignKey: 'eventId', onDelete: 'CASCADE' });
Certificate.belongsTo(Event, { foreignKey: 'eventId' });

// New Relationships: Feedback
Event.hasMany(Feedback, { foreignKey: 'eventId', onDelete: 'CASCADE' });
Feedback.belongsTo(Event, { foreignKey: 'eventId' });
Student.hasMany(Feedback, { foreignKey: 'studentId', onDelete: 'CASCADE' });
Feedback.belongsTo(Student, { foreignKey: 'studentId' });

// New Relationships: Waitlist
Event.hasMany(Waitlist, { foreignKey: 'eventId', onDelete: 'CASCADE' });
Waitlist.belongsTo(Event, { foreignKey: 'eventId' });
Student.hasMany(Waitlist, { foreignKey: 'studentId', onDelete: 'CASCADE' });
Waitlist.belongsTo(Student, { foreignKey: 'studentId' });

// New Relationships: Volunteer
Student.hasMany(Volunteer, { foreignKey: 'studentId', onDelete: 'CASCADE' });
Volunteer.belongsTo(Student, { foreignKey: 'studentId' });
Event.hasMany(Volunteer, { foreignKey: 'eventId', onDelete: 'CASCADE' });
Volunteer.belongsTo(Event, { foreignKey: 'eventId' });

Volunteer.hasMany(VolunteerTask, { foreignKey: 'volunteerId', onDelete: 'CASCADE' });
VolunteerTask.belongsTo(Volunteer, { foreignKey: 'volunteerId' });
Event.hasMany(VolunteerTask, { foreignKey: 'eventId', onDelete: 'CASCADE' });
VolunteerTask.belongsTo(Event, { foreignKey: 'eventId' });

// New Relationships: Leaderboard
Student.hasOne(Leaderboard, { foreignKey: 'studentId', onDelete: 'CASCADE' });
Leaderboard.belongsTo(Student, { foreignKey: 'studentId' });

// Event Gallery Relationships
Event.hasMany(EventGallery, { foreignKey: 'eventId', onDelete: 'CASCADE' });
EventGallery.belongsTo(Event, { foreignKey: 'eventId' });
Admin.hasMany(EventGallery, { foreignKey: 'uploadedBy', onDelete: 'SET NULL' });
EventGallery.belongsTo(Admin, { foreignKey: 'uploadedBy', as: 'uploader' });

// Gamification relationships
Student.belongsToMany(Badge, { through: StudentBadge, foreignKey: 'studentId', otherKey: 'badgeId', onDelete: 'CASCADE' });
Badge.belongsToMany(Student, { through: StudentBadge, foreignKey: 'badgeId', otherKey: 'studentId', onDelete: 'CASCADE' });

Student.hasMany(StudentBadge, { foreignKey: 'studentId', onDelete: 'CASCADE' });
StudentBadge.belongsTo(Student, { foreignKey: 'studentId' });

Badge.hasMany(StudentBadge, { foreignKey: 'badgeId', onDelete: 'CASCADE' });
StudentBadge.belongsTo(Badge, { foreignKey: 'badgeId' });

Student.hasMany(ActivityLog, { foreignKey: 'studentId', onDelete: 'CASCADE' });
ActivityLog.belongsTo(Student, { foreignKey: 'studentId' });

// Sprint 8 AI Recommendations Relationships
Student.hasMany(AIRecommendation, { foreignKey: 'studentId', onDelete: 'CASCADE' });
AIRecommendation.belongsTo(Student, { foreignKey: 'studentId' });
Event.hasMany(AIRecommendation, { foreignKey: 'eventId', onDelete: 'CASCADE' });
AIRecommendation.belongsTo(Event, { foreignKey: 'eventId' });

module.exports = {
  sequelize,
  Student,
  Admin,
  Event,
  Registration,
  Attendance,
  Notification,
  Certificate,
  AuditLog,
  Feedback,
  Waitlist,
  Volunteer,
  VolunteerTask,
  Leaderboard,
  EventGallery,
  LoginHistory,
  TokenBlacklist,
  Badge,
  StudentBadge,
  ActivityLog,
  SystemSetting,
  AIConversation,
  AIRecommendation,
  AIInsight,
};
