const express = require('express');
const router = express.Router();
const multer = require('multer');
const uploadMemory = multer();

const {
  loginAdmin,
  getAdminProfile,
  updateAdminProfile,
  changeAdminPassword,
  getDatabaseBackup,
  getStudentsList,
} = require('../controllers/adminController');
const {
  getAdminDashboard,
  getAdminAnalytics,
  getAdminReports,
  getStudentProfile,
} = require('../controllers/analyticsController');
const {
  getAllAdmins,
  createAdmin,
  updateAdmin,
  deleteAdmin,
  toggleAdminActive,
  resetAdminPassword,
  getAllStudents,
  updateStudent,
  toggleStudentActive,
  getStudentDetails,
  getSystemSettings,
  updateSystemSettings,
} = require('../controllers/enterpriseAdminController');
const {
  createManualBackup,
  getBackupHistory,
  downloadBackup,
  restoreBackup,
} = require('../controllers/backupController');
const {
  broadcastAnnouncement,
} = require('../controllers/announcementController');
const {
  bulkRegisterStudents,
  bulkMarkAttendance,
  bulkIssueCertificates,
  bulkSendNotifications,
  bulkApproveVolunteers,
  bulkDeleteResources,
  bulkUpdateEvents,
} = require('../controllers/bulkController');

const { protect, adminOnly, checkPermission } = require('../middleware/authMiddleware');
const { validateAdminLogin } = require('../middleware/validation');
const { authRateLimiter } = require('../middleware/security');
const { getAdminRegistrationStats } = require('../controllers/registrationController');

router.post('/login', authRateLimiter, validateAdminLogin, loginAdmin);

// Protected Admin Routes
router.use(protect);
router.use(adminOnly);

router.get('/profile', getAdminProfile);
router.put('/profile', updateAdminProfile);
router.put('/change-password', changeAdminPassword);

router.get('/students', getStudentsList);
router.get('/registrations', getAdminRegistrationStats);
router.get('/dashboard', getAdminDashboard);
router.get('/analytics', getAdminAnalytics);
router.get('/reports', getAdminReports);
router.get('/backup', getDatabaseBackup);
router.get('/student/:id/profile', getStudentProfile);

// -------------------------------------------------------------
// SPRINT 6 ENTERPRISE ADMIN ROUTES
// -------------------------------------------------------------

// Admin Management (Super Admin / Admins permission)
router.get('/admins', checkPermission('Admins'), getAllAdmins);
router.post('/admins', checkPermission('Admins'), createAdmin);
router.put('/admins/:id', checkPermission('Admins'), updateAdmin);
router.delete('/admins/:id', checkPermission('Admins'), deleteAdmin);
router.put('/admins/:id/toggle', checkPermission('Admins'), toggleAdminActive);
router.put('/admins/:id/reset-password', checkPermission('Admins'), resetAdminPassword);

// Student Management (Students permission)
router.get('/students/manage', checkPermission('Students'), getAllStudents);
router.put('/students/:id', checkPermission('Students'), updateStudent);
router.put('/students/:id/toggle', checkPermission('Students'), toggleStudentActive);
router.get('/students/:id/details', checkPermission('Students'), getStudentDetails);

// System Settings (Settings permission)
router.get('/settings', checkPermission('Settings'), getSystemSettings);
router.put('/settings', checkPermission('Settings'), updateSystemSettings);

// Database Backup Manager (Settings / Audit Logs permission)
router.get('/backups', checkPermission('Audit Logs'), getBackupHistory);
router.post('/backups', checkPermission('Audit Logs'), createManualBackup);
router.get('/backups/:fileName', checkPermission('Audit Logs'), downloadBackup);
router.post('/backups/restore', checkPermission('Audit Logs'), uploadMemory.single('file'), restoreBackup);

// Announcements (Notifications permission)
router.post('/announcements/broadcast', checkPermission('Notifications'), broadcastAnnouncement);

// Bulk Operations
router.post('/bulk/students', checkPermission('Students'), bulkRegisterStudents);
router.post('/bulk/attendance', checkPermission('Attendance'), bulkMarkAttendance);
router.post('/bulk/certificates', checkPermission('Certificates'), bulkIssueCertificates);
router.post('/bulk/notifications', checkPermission('Notifications'), bulkSendNotifications);
router.post('/bulk/volunteers/approve', checkPermission('Volunteers'), bulkApproveVolunteers);
router.post('/bulk/delete', checkPermission('Students'), bulkDeleteResources);
router.post('/bulk/events/update', checkPermission('Events'), bulkUpdateEvents);

module.exports = router;
