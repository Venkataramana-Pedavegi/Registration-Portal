const express = require('express');
const router = express.Router();
const {
  applyVolunteer,
  getVolunteers,
  approveVolunteer,
  assignTask,
  updateTaskStatus,
  getVolunteerDashboard,
  updateVolunteerHours,
  issueVolunteerCertificate,
  getVolunteerAnalytics,
} = require('../controllers/volunteerController');
const { protect, adminOnly, studentOnly } = require('../middleware/authMiddleware');

router.post('/apply', protect, studentOnly, applyVolunteer);
router.get('/my', protect, studentOnly, getVolunteerDashboard);
router.put('/tasks/:id/status', protect, updateTaskStatus);

router.get('/admin', protect, adminOnly, getVolunteers);
router.get('/admin/analytics', protect, adminOnly, getVolunteerAnalytics);
router.put('/admin/approve/:id', protect, adminOnly, approveVolunteer);
router.put('/admin/hours/:id', protect, adminOnly, updateVolunteerHours);
router.post('/admin/certificate/:id', protect, adminOnly, issueVolunteerCertificate);
router.post('/admin/tasks', protect, adminOnly, assignTask);

module.exports = router;
