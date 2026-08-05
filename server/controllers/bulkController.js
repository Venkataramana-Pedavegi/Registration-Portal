const { Student, Registration, Attendance, Certificate, Notification, Volunteer, Event } = require('../models');
const sendEmail = require('../utils/sendEmail');
const { logAudit } = require('../middleware/auditLogger');
const { Op } = require('sequelize');

// 1. Bulk Student Registration
const bulkRegisterStudents = async (req, res) => {
  try {
    const { students } = req.body; // Array of { fullName, rollNumber, email, department, year }
    if (!students || !Array.isArray(students)) {
      return res.status(400).json({ message: 'A valid array of students is required' });
    }

    const created = [];
    const skipped = [];

    for (const s of students) {
      if (!s.fullName || !s.rollNumber || !s.email || !s.department || !s.year) {
        skipped.push({ student: s, reason: 'Missing required fields' });
        continue;
      }

      // Check duplicate email or roll number
      const duplicate = await Student.findOne({
        where: {
          [Op.or]: [
            { rollNumber: s.rollNumber.trim().toUpperCase() },
            { email: s.email.trim().toLowerCase() }
          ]
        }
      });

      if (duplicate) {
        skipped.push({ student: s, reason: 'Roll number or email already registered' });
        continue;
      }

      // Create student with a default password (e.g. rollnumber123)
      const defaultPassword = `${s.rollNumber.trim().toLowerCase()}123`;
      const newStudent = await Student.create({
        fullName: s.fullName.trim(),
        rollNumber: s.rollNumber.trim().toUpperCase(),
        email: s.email.trim().toLowerCase(),
        department: s.department.trim(),
        year: String(s.year).trim(),
        password: defaultPassword,
        isActive: true,
        isVerified: true,
      });

      created.push(newStudent);
    }

    await logAudit({ req, userId: req.user.id, userRole: req.role || 'Admin', action: 'BULK_STUDENT_REGISTER', details: `Bulk registered students. Created: ${created.length}, Skipped: ${skipped.length}` });

    res.json({
      message: 'Bulk registration completed',
      createdCount: created.length,
      skippedCount: skipped.length,
      skipped,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error during bulk registration', error: error.message });
  }
};

// 2. Bulk Attendance Marking
const bulkMarkAttendance = async (req, res) => {
  try {
    const { eventId, attendanceRecords } = req.body; // eventId, and array of { rollNumber, status }
    if (!eventId || !attendanceRecords || !Array.isArray(attendanceRecords)) {
      return res.status(400).json({ message: 'Event ID and attendance records array are required' });
    }

    const event = await Event.findByPk(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    let markedCount = 0;
    const skipped = [];

    for (const record of attendanceRecords) {
      const student = await Student.findOne({ where: { rollNumber: record.rollNumber.trim().toUpperCase() } });
      if (!student) {
        skipped.push({ record, reason: 'Student not found with this roll number' });
        continue;
      }

      const registration = await Registration.findOne({
        where: { eventId, studentId: student.id, status: 'Registered' },
      });

      if (!registration) {
        skipped.push({ record, reason: 'Student is not registered for this event' });
        continue;
      }

      const status = record.status || 'Present';

      const [attendance, created] = await Attendance.findOrCreate({
        where: { registrationId: registration.id },
        defaults: {
          registrationId: registration.id,
          eventId,
          studentId: student.id,
          attendanceStatus: status,
          markedAt: new Date(),
        },
      });

      if (!created) {
        attendance.attendanceStatus = status;
        attendance.markedAt = new Date();
        await attendance.save();
      }

      markedCount++;

      // Issue certificate if Present
      if (status === 'Present') {
        const certCode = `CERT-2026-${registration.id.toString().padStart(4, '0')}`;
        await Certificate.findOrCreate({
          where: { registrationId: registration.id },
          defaults: {
            registrationId: registration.id,
            studentId: student.id,
            eventId,
            certificateId: certCode,
            issueDate: new Date(),
            qrVerificationCode: certCode,
          },
        });

        await Notification.create({
          userId: student.id,
          userRole: 'Student',
          title: 'Certificate Issued',
          message: `Your participation certificate for "${event.title}" is ready!`,
          type: 'Certificate',
        }).catch(err => console.error(err));
      }
    }

    await logAudit({ req, userId: req.user.id, userRole: req.role || 'Admin', action: 'BULK_ATTENDANCE_MARK', details: `Bulk marked attendance for event ID ${eventId}. Processed: ${markedCount}, Skipped: ${skipped.length}` });

    res.json({
      message: 'Bulk attendance marking completed',
      markedCount,
      skippedCount: skipped.length,
      skipped,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error marking bulk attendance', error: error.message });
  }
};

// 3. Bulk Certificates Generation
const bulkIssueCertificates = async (req, res) => {
  try {
    const { eventId, rollNumbers } = req.body; // eventId, and array of roll numbers
    if (!eventId || !rollNumbers || !Array.isArray(rollNumbers)) {
      return res.status(400).json({ message: 'Event ID and roll numbers list are required' });
    }

    const event = await Event.findByPk(eventId);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    let issuedCount = 0;
    const skipped = [];

    for (const roll of rollNumbers) {
      const student = await Student.findOne({ where: { rollNumber: roll.trim().toUpperCase() } });
      if (!student) {
        skipped.push({ rollNumber: roll, reason: 'Student not found' });
        continue;
      }

      const registration = await Registration.findOne({
        where: { eventId, studentId: student.id, status: 'Registered' },
      });

      if (!registration) {
        skipped.push({ rollNumber: roll, reason: 'Student is not registered' });
        continue;
      }

      const certCode = `CERT-2026-${registration.id.toString().padStart(4, '0')}`;
      const [certificate, created] = await Certificate.findOrCreate({
        where: { registrationId: registration.id },
        defaults: {
          registrationId: registration.id,
          studentId: student.id,
          eventId,
          certificateId: certCode,
          issueDate: new Date(),
          qrVerificationCode: certCode,
        },
      });

      if (created) {
        issuedCount++;
        await Notification.create({
          userId: student.id,
          userRole: 'Student',
          title: 'Certificate Issued',
          message: `Your participation certificate for "${event.title}" is ready!`,
          type: 'Certificate',
        }).catch(err => console.error(err));
      } else {
        skipped.push({ rollNumber: roll, reason: 'Certificate already issued' });
      }
    }

    await logAudit({ req, userId: req.user.id, userRole: req.role || 'Admin', action: 'BULK_CERTIFICATES_ISSUE', details: `Bulk issued certificates for event ID ${eventId}. Issued: ${issuedCount}, Skipped: ${skipped.length}` });

    res.json({
      message: 'Bulk certificate issuance completed',
      issuedCount,
      skippedCount: skipped.length,
      skipped,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error generating bulk certificates', error: error.message });
  }
};

// 4. Bulk Notifications & Emails
const bulkSendNotifications = async (req, res) => {
  try {
    const { recipients, title, message, sendEmailNotification } = req.body; // Array of emails/roll numbers, title, message, boolean
    if (!recipients || !Array.isArray(recipients) || !title || !message) {
      return res.status(400).json({ message: 'Recipients array, title, and message are required' });
    }

    let count = 0;

    for (const identifier of recipients) {
      const student = await Student.findOne({
        where: {
          [Op.or]: [
            { rollNumber: identifier.trim().toUpperCase() },
            { email: identifier.trim().toLowerCase() }
          ]
        }
      });

      if (student && student.isActive) {
        // Send In-App notification
        await Notification.create({
          userId: student.id,
          userRole: 'Student',
          title,
          message,
          type: 'Alert',
        });

        // Send email
        if (sendEmailNotification && student.email) {
          sendEmail({
            to: student.email,
            subject: title,
            templateTitle: 'Notification Alert',
            html: `<p>${message.replace(/\n/g, '<br/>')}</p>`,
          }).catch(err => console.error(`Email send failed for student ${student.email}:`, err.message));
        }

        count++;
      }
    }

    await logAudit({ req, userId: req.user.id, userRole: req.role || 'Admin', action: 'BULK_NOTIFICATIONS_SEND', details: `Sent bulk notifications to ${count} students` });

    res.json({ message: `Successfully sent bulk notifications to ${count} students` });
  } catch (error) {
    res.status(500).json({ message: 'Server error sending bulk notifications', error: error.message });
  }
};

// 5. Bulk Volunteer Approval
const bulkApproveVolunteers = async (req, res) => {
  try {
    const { volunteerIds, status } = req.body; // array of volunteer record IDs, status 'Approved' or 'Rejected'
    if (!volunteerIds || !Array.isArray(volunteerIds) || !status) {
      return res.status(400).json({ message: 'Volunteer IDs array and status are required' });
    }

    const [updatedCount] = await Volunteer.update(
      { status },
      { where: { id: { [Op.in]: volunteerIds } } }
    );

    // Send notifications to volunteer students
    const volunteerRecords = await Volunteer.findAll({
      where: { id: { [Op.in]: volunteerIds } },
      include: [{ model: Student }],
    });

    for (const v of volunteerRecords) {
      if (v.Student) {
        await Notification.create({
          userId: v.studentId,
          userRole: 'Student',
          title: `Volunteer Request ${status}`,
          message: `Your request to volunteer for event ID ${v.eventId} has been ${status.toLowerCase()}.`,
          type: 'Alert',
        }).catch(err => console.error(err));
      }
    }

    await logAudit({ req, userId: req.user.id, userRole: req.role || 'Admin', action: 'BULK_VOLUNTEER_APPROVE', details: `Bulk updated volunteer requests status to ${status} for ${updatedCount} records` });

    res.json({ message: `Successfully bulk ${status.toLowerCase()} ${updatedCount} volunteer request(s).` });
  } catch (error) {
    res.status(500).json({ message: 'Server error approving volunteers', error: error.message });
  }
};

// 6. Bulk Delete
const bulkDeleteResources = async (req, res) => {
  try {
    const { type, ids } = req.body; // type 'students' or 'events', array of IDs
    if (!type || !ids || !Array.isArray(ids)) {
      return res.status(400).json({ message: 'Resource type and IDs array are required' });
    }

    let deletedCount = 0;

    if (type === 'students') {
      deletedCount = await Student.destroy({ where: { id: { [Op.in]: ids } } });
    } else if (type === 'events') {
      deletedCount = await Event.destroy({ where: { id: { [Op.in]: ids } } });
    } else {
      return res.status(400).json({ message: 'Invalid resource type for deletion' });
    }

    await logAudit({ req, userId: req.user.id, userRole: req.role || 'Admin', action: 'BULK_DELETION', details: `Bulk deleted ${deletedCount} ${type}` });

    res.json({ message: `Successfully deleted ${deletedCount} ${type}.` });
  } catch (error) {
    res.status(500).json({ message: 'Server error performing bulk deletion', error: error.message });
  }
};

// 7. Bulk Event Update
const bulkUpdateEvents = async (req, res) => {
  try {
    const { ids, category, venue, status } = req.body; // array of event IDs, and update fields
    if (!ids || !Array.isArray(ids)) {
      return res.status(400).json({ message: 'Event IDs array is required' });
    }

    const updates = {};
    if (category) updates.category = category;
    if (venue) updates.venue = venue;
    if (status) updates.status = status;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: 'No valid fields provided for update' });
    }

    const [updatedCount] = await Event.update(updates, {
      where: { id: { [Op.in]: ids } }
    });

    await logAudit({ req, userId: req.user.id, userRole: req.role || 'Admin', action: 'BULK_EVENT_UPDATE', details: `Bulk updated ${updatedCount} events` });

    res.json({ message: `Successfully updated ${updatedCount} event(s).` });
  } catch (error) {
    res.status(500).json({ message: 'Server error performing bulk event update', error: error.message });
  }
};

module.exports = {
  bulkRegisterStudents,
  bulkMarkAttendance,
  bulkIssueCertificates,
  bulkSendNotifications,
  bulkApproveVolunteers,
  bulkDeleteResources,
  bulkUpdateEvents,
};
