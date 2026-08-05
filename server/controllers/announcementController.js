const { Student, Registration, Volunteer, Notification } = require('../models');
const sendEmail = require('../utils/sendEmail');
const { getIO } = require('../utils/socket');
const { logAudit } = require('../middleware/auditLogger');
const { Op } = require('sequelize');

const broadcastAnnouncement = async (req, res) => {
  try {
    const { title, content, targetAudience, targetValue } = req.body;

    if (!title || !content || !targetAudience) {
      return res.status(400).json({ message: 'Title, content, and target audience are required' });
    }

    let students = [];

    // 1. Resolve student audience based on segment criteria
    if (targetAudience === 'all') {
      students = await Student.findAll({ where: { isActive: true } });
    } else if (targetAudience === 'department') {
      students = await Student.findAll({ where: { department: targetValue, isActive: true } });
    } else if (targetAudience === 'year') {
      students = await Student.findAll({ where: { year: targetValue, isActive: true } });
    } else if (targetAudience === 'registered') {
      const registrations = await Registration.findAll({
        where: { eventId: targetValue, status: 'Registered' },
        include: [{ model: Student }],
      });
      students = registrations.map((r) => r.Student).filter((s) => s && s.isActive);
    } else if (targetAudience === 'volunteers') {
      const volunteers = await Volunteer.findAll({
        where: { status: 'Approved' },
        include: [{ model: Student }],
      });
      students = volunteers.map((v) => v.Student).filter((s) => s && s.isActive);
    } else {
      return res.status(400).json({ message: 'Invalid target audience segment' });
    }

    if (students.length === 0) {
      return res.status(400).json({ message: 'No active student recipients found for this audience segment' });
    }

    // 2. Create in-app system notifications for all resolved students
    const notificationsToCreate = students.map((student) => ({
      userId: student.id,
      userRole: 'Student',
      title: `Announcement: ${title}`,
      message: content,
      isRead: false,
    }));

    await Notification.bulkCreate(notificationsToCreate);

    // 3. Send email notifications to all recipients asynchronously
    const emailPromises = students.map(async (student) => {
      if (student.email) {
        return sendEmail({
          to: student.email,
          subject: `Announcement: ${title}`,
          templateTitle: 'System Announcement',
          html: `
            <div style="font-family: sans-serif; line-height: 1.6; color: #333;">
              <h2 style="color: #2563eb; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px;">${title}</h2>
              <p>Hello <strong>${student.fullName}</strong>,</p>
              <p>${content.replace(/\n/g, '<br/>')}</p>
              <p style="font-size: 11px; color: #666; border-top: 1px solid #e2e8f0; padding-top: 10px; margin-top: 25px;">
                You received this email because you are registered under category: <em>${targetAudience} (${targetValue || 'All'})</em> on Sri Vasavi Event Management Portal.
              </p>
            </div>
          `,
        }).catch((err) => console.error(`Failed to send announcement email to ${student.email}:`, err.message));
      }
    });

    Promise.all(emailPromises);

    // 4. Emit live update via Socket.io
    try {
      const io = getIO();
      if (io) {
        io.emit('announcement_broadcast', { title, message: content, targetAudience });
      }
    } catch (socketErr) {
      console.error('Socket broadcast failed:', socketErr.message);
    }

    await logAudit({ req, userId: req.user.id, userRole: req.role || 'Admin', action: 'ANNOUNCEMENT_BROADCAST', details: `Sent announcement "${title}" to segment: ${targetAudience} (${targetValue || ''})` });

    res.json({ message: `Announcement broadcast successfully to ${students.length} recipient(s).` });
  } catch (error) {
    res.status(500).json({ message: 'Server error broadcasting announcement', error: error.message });
  }
};

module.exports = {
  broadcastAnnouncement,
};
