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
    }

    // Format response
    const result = attendance.toJSON();
    result._id = result.id;
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

module.exports = {
  markAttendance,
  updateAttendance,
  getEventAttendance,
};
