const { Attendance, Registration, Event, Student, Certificate, Notification } = require('../models');

// @desc    Mark attendance for a registration
// @route   POST /api/attendance
// @access  Private/Admin
const markAttendance = async (req, res) => {
  try {
    const { registrationId, attendanceStatus } = req.body;

    if (!registrationId) {
      return res.status(400).json({ message: 'Registration ID is required' });
    }

    const registration = await Registration.findByPk(registrationId);
    if (!registration) {
      return res.status(404).json({ message: 'Registration record not found' });
    }

    if (registration.status === 'Cancelled') {
      return res.status(400).json({ message: 'Cannot mark attendance for a cancelled registration' });
    }

    const status = attendanceStatus || 'Present';

    // Prevent duplicate attendance Present records
    if (status === 'Present') {
      const existingAttendance = await Attendance.findOne({ where: { registrationId } });
      if (existingAttendance && existingAttendance.attendanceStatus === 'Present') {
        return res.status(400).json({
          message: 'Attendance already marked Present for this student and event.',
          alreadyScanned: true
        });
      }
    }

    // Upsert attendance record
    let [attendance, created] = await Attendance.findOrCreate({
      where: { registrationId },
      defaults: {
        registrationId,
        eventId: registration.eventId,
        studentId: registration.studentId,
        attendanceStatus: status,
        markedAt: new Date(),
      },
    });

    if (!created) {
      attendance.attendanceStatus = status;
      attendance.markedAt = new Date();
      await attendance.save();
    }

    // Auto issue certificate if status Present
    if (status === 'Present') {
      const certCode = `CERT-2026-${registration.id.toString().padStart(4, '0')}`;
      await Certificate.findOrCreate({
        where: { registrationId: registration.id },
        defaults: {
          registrationId: registration.id,
          studentId: registration.studentId,
          eventId: registration.eventId,
          certificateId: certCode,
          issueDate: new Date(),
          qrVerificationCode: certCode,
        },
      });

      await Notification.create({
        userId: registration.studentId,
        userRole: 'Student',
        title: 'Certificate Issued!',
        message: `Your participation certificate for event #${registration.eventId} is ready to download.`,
        type: 'Certificate',
      });

      // Fetch student email for notifications
      const fullReg = await Registration.findByPk(registrationId, {
        include: [
          { model: Student, attributes: ['fullName', 'email'] },
          { model: Event, attributes: ['title'] },
        ],
      });

      if (fullReg && fullReg.Student?.email) {
        const sendEmail = require('../utils/sendEmail');
        await sendEmail({
          to: fullReg.Student.email,
          subject: `Attendance Confirmed & Certificate Issued - ${fullReg.Event?.title}`,
          templateTitle: 'Attendance & Certificate Confirmed',
          html: `
            <p>Dear <strong>${fullReg.Student.fullName}</strong>,</p>
            <p>Your attendance for <strong>${fullReg.Event?.title}</strong> has been marked <strong>PRESENT</strong>!</p>
            <p>Your official Certificate of Participation (Certificate ID: <strong>${certCode}</strong>) is now generated and ready for instant PDF download in your student portal.</p>
          `,
        });
      }
    }

    // Log audit logs
    const { logAudit } = require('../middleware/auditLogger');
    await logAudit({
      req,
      userId: req.user.id,
      userRole: req.role || 'Admin',
      action: 'ATTENDANCE_UPDATE',
      details: `Attendance marked ${status} for student ${registration.studentId} on event ${registration.eventId}`,
    });

    if (status === 'Present') {
      await logAudit({
        req,
        userId: registration.studentId,
        userRole: 'Student',
        action: 'CERTIFICATE_GENERATION',
        details: `Certificate generated for student ${registration.studentId} on event ${registration.eventId}`,
      });

      // Award Attendance (+25 XP) and Certificate (+20 XP) points
      try {
        const { awardPoints } = require('../services/GamificationService');
        const eventObj = await Event.findByPk(registration.eventId, { attributes: ['title'] });
        await awardPoints(
          registration.studentId,
          25,
          'ATTEND_EVENT',
          `Attended event: ${eventObj?.title || 'Event'}`,
          registration.eventId,
          req
        );
        await awardPoints(
          registration.studentId,
          20,
          'CERTIFICATE_EARNED',
          `Earned Certificate for event: ${eventObj?.title || 'Event'}`,
          registration.eventId,
          req
        );
      } catch (gErr) {
        console.error('Non-blocking attendance/certificate points allocation error:', gErr.message);
      }
    }

    // Format response
    const result = attendance.toJSON();
    result._id = result.id;

    const { broadcastAttendanceUpdated, broadcastCertificateGenerated } = require('../utils/socket');
    broadcastAttendanceUpdated(registration.eventId, attendance);
    if (status === 'Present') {
      const cert = await Certificate.findOne({ where: { registrationId: registration.id } });
      if (cert) {
        broadcastCertificateGenerated(registration.studentId, cert);
      }
    }

    res.status(created ? 201 : 200).json(result);
  } catch (error) {
    res.status(500).json({ message: 'Server error marking attendance', error: error.message });
  }
};

// @desc    Update attendance status
// @route   PUT /api/attendance/:id
// @access  Private/Admin
const updateAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const { attendanceStatus } = req.body;

    if (isNaN(id) || !Number.isInteger(Number(id))) {
      return res.status(400).json({ message: 'Invalid attendance ID format' });
    }

    const attendance = await Attendance.findByPk(id);
    if (!attendance) {
      return res.status(404).json({ message: 'Attendance record not found' });
    }

    if (attendanceStatus) {
      if (attendanceStatus === 'Present' && attendance.attendanceStatus === 'Present') {
        return res.status(400).json({
          message: 'Attendance already marked Present for this student and event.',
          alreadyScanned: true
        });
      }
      attendance.attendanceStatus = attendanceStatus;
      attendance.markedAt = new Date();
      await attendance.save();

      if (attendanceStatus === 'Present') {
        const certCode = `CERT-2026-${attendance.registrationId.toString().padStart(4, '0')}`;
        await Certificate.findOrCreate({
          where: { registrationId: attendance.registrationId },
          defaults: {
            registrationId: attendance.registrationId,
            studentId: attendance.studentId,
            eventId: attendance.eventId,
            certificateId: certCode,
            issueDate: new Date(),
            qrVerificationCode: certCode,
          },
        });

        // Award Attendance (+25 XP) and Certificate (+20 XP) points
        try {
          const { awardPoints } = require('../services/GamificationService');
          const eventObj = await Event.findByPk(attendance.eventId, { attributes: ['title'] });
          await awardPoints(
            attendance.studentId,
            25,
            'ATTEND_EVENT',
            `Attended event: ${eventObj?.title || 'Event'}`,
            attendance.eventId,
            req
          );
          await awardPoints(
            attendance.studentId,
            20,
            'CERTIFICATE_EARNED',
            `Earned Certificate for event: ${eventObj?.title || 'Event'}`,
            attendance.eventId,
            req
          );
        } catch (gErr) {
          console.error('Non-blocking update attendance points allocation error:', gErr.message);
        }
      }
    }

    const result = attendance.toJSON();
    result._id = result.id;
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Server error updating attendance', error: error.message });
  }
};

// @desc    Get attendance list for a specific event
// @route   GET /api/attendance/event/:eventId
// @access  Private/Admin
const getEventAttendance = async (req, res) => {
  try {
    const { eventId } = req.params;

    if (isNaN(eventId) || !Number.isInteger(Number(eventId))) {
      return res.status(400).json({ message: 'Invalid Event ID format' });
    }

    const event = await Event.findByPk(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const registrations = await Registration.findAll({
      where: { eventId, status: 'Registered' },
      include: [
        {
          model: Student,
          attributes: ['id', 'fullName', 'rollNumber', 'email', 'department', 'year'],
        },
        {
          model: Attendance,
        },
      ],
      order: [['registrationDate', 'ASC']],
    });

    let presentCount = 0;
    let absentCount = 0;
    let unmarkedCount = 0;

    const formatted = registrations.map((reg) => {
      const plain = reg.toJSON();
      plain._id = plain.id;
      if (plain.Student) plain.Student._id = plain.Student.id;
      
      if (plain.Attendance) {
        plain.Attendance._id = plain.Attendance.id;
        if (plain.Attendance.attendanceStatus === 'Present') presentCount++;
        else if (plain.Attendance.attendanceStatus === 'Absent') absentCount++;
      } else {
        unmarkedCount++;
      }
      return plain;
    });

    const totalRegistered = registrations.length;
    const attendancePercentage = totalRegistered > 0 ? Math.round((presentCount / totalRegistered) * 100) : 0;

    res.json({
      event: {
        id: event.id,
        _id: event.id,
        title: event.title,
        capacity: event.capacity,
        availableSeats: event.availableSeats,
      },
      stats: {
        totalRegistered,
        presentCount,
        absentCount,
        unmarkedCount,
        attendancePercentage,
      },
      participants: formatted,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error retrieving event attendance', error: error.message });
  }
};

// @desc    Import attendance via CSV/Excel records (Admin Only)
// @route   POST /api/attendance/import
// @access  Private/Admin
const importAttendance = async (req, res) => {
  try {
    const userRole = req.role || req.user?.role;
    const isStrictAdmin = ['Admin', 'Super Admin'].includes(userRole);

    if (!isStrictAdmin) {
      return res.status(403).json({ message: 'Access denied: Admins only' });
    }

    const { eventId, records, dryRun } = req.body;

    if (!eventId) {
      return res.status(400).json({ message: 'Event ID is required' });
    }

    const event = await Event.findByPk(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Selected event not found' });
    }

    if (!Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ message: 'No attendance records provided for import' });
    }

    const validRecords = [];
    const errorRecords = [];
    let importedCount = 0;
    let skippedCount = 0;

    for (let index = 0; index < records.length; index++) {
      const row = records[index];
      const regId = row.registrationId || row.RegistrationId || row.id;
      const rollNum = row.rollNumber || row.RollNumber || row.rollNum;
      const statusInput = row.attendanceStatus || row.status || row.Status || 'Present';
      const status = String(statusInput).trim().toLowerCase() === 'absent' ? 'Absent' : 'Present';

      let registration = null;

      if (regId && !isNaN(Number(regId))) {
        registration = await Registration.findOne({
          where: { id: Number(regId), eventId },
          include: [{ model: Student, attributes: ['id', 'fullName', 'rollNumber', 'email'] }]
        });
      }

      if (!registration && rollNum) {
        const student = await Student.findOne({ where: { rollNumber: String(rollNum).trim() } });
        if (student) {
          registration = await Registration.findOne({
            where: { studentId: student.id, eventId },
            include: [{ model: Student, attributes: ['id', 'fullName', 'rollNumber', 'email'] }]
          });
        }
      }

      if (!registration) {
        errorRecords.push({
          row: index + 1,
          registrationId: regId || null,
          rollNumber: rollNum || null,
          reason: 'Registration record not found or does not belong to the selected event'
        });
        skippedCount++;
        continue;
      }

      if (registration.status === 'Cancelled') {
        errorRecords.push({
          row: index + 1,
          registrationId: registration.id,
          rollNumber: registration.Student?.rollNumber,
          studentName: registration.Student?.fullName,
          reason: 'Registration is cancelled'
        });
        skippedCount++;
        continue;
      }

      // Check duplicate Present
      const existingAttendance = await Attendance.findOne({
        where: { registrationId: registration.id }
      });

      if (existingAttendance && existingAttendance.attendanceStatus === 'Present' && status === 'Present') {
        errorRecords.push({
          row: index + 1,
          registrationId: registration.id,
          rollNumber: registration.Student?.rollNumber,
          studentName: registration.Student?.fullName,
          reason: 'Duplicate: Attendance already marked Present for this student and event'
        });
        skippedCount++;
        continue;
      }

      validRecords.push({
        registrationId: registration.id,
        eventId: registration.eventId,
        studentId: registration.studentId,
        studentName: registration.Student?.fullName,
        rollNumber: registration.Student?.rollNumber,
        email: registration.Student?.email,
        status,
        existingAttendance
      });
    }

    if (dryRun) {
      return res.json({
        message: 'Import validation preview generated successfully',
        summary: {
          totalProcessed: records.length,
          validCount: validRecords.length,
          invalidCount: errorRecords.length
        },
        validRecords,
        errorRecords
      });
    }

    // Save valid records
    for (const record of validRecords) {
      let [att, created] = await Attendance.findOrCreate({
        where: { registrationId: record.registrationId },
        defaults: {
          registrationId: record.registrationId,
          eventId: record.eventId,
          studentId: record.studentId,
          attendanceStatus: record.status,
          markedAt: new Date(),
        }
      });

      if (!created) {
        att.attendanceStatus = record.status;
        att.markedAt = new Date();
        await att.save();
      }

      importedCount++;

      if (record.status === 'Present') {
        const certCode = `CERT-2026-${record.registrationId.toString().padStart(4, '0')}`;
        await Certificate.findOrCreate({
          where: { registrationId: record.registrationId },
          defaults: {
            registrationId: record.registrationId,
            studentId: record.studentId,
            eventId: record.eventId,
            certificateId: certCode,
            issueDate: new Date(),
            qrVerificationCode: certCode,
          }
        });

        await Notification.create({
          userId: record.studentId,
          userRole: 'Student',
          title: 'Certificate Issued!',
          message: `Your participation certificate for event #${record.eventId} is ready to download.`,
          type: 'Certificate',
        });

        try {
          const { awardPoints } = require('../services/GamificationService');
          await awardPoints(record.studentId, 25, 'ATTEND_EVENT', `Attended event: ${event.title}`, record.eventId, req);
          await awardPoints(record.studentId, 20, 'CERTIFICATE_EARNED', `Earned Certificate for event: ${event.title}`, record.eventId, req);
        } catch (gErr) {
          console.error('Non-blocking import points allocation error:', gErr.message);
        }
      }
    }

    const { logAudit } = require('../middleware/auditLogger');
    await logAudit({
      req,
      userId: req.user.id,
      userRole: req.role || 'Admin',
      action: 'ATTENDANCE_IMPORT',
      details: `Imported ${importedCount} attendance records for event ID ${eventId}`,
    });

    res.json({
      message: `Successfully imported ${importedCount} attendance records`,
      summary: {
        totalProcessed: records.length,
        imported: importedCount,
        skipped: skippedCount,
        errorRecords
      }
    });
  } catch (error) {
    console.error('Import Attendance Error:', error);
    res.status(500).json({ message: 'Server error importing attendance', error: error.message });
  }
};

module.exports = {
  markAttendance,
  updateAttendance,
  getEventAttendance,
  importAttendance,
};
