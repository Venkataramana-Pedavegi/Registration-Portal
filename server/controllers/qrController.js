const { Registration, Event, Student, Attendance, Certificate, Notification } = require('../models');
const { generateQRCode } = require('../utils/qrGenerator');
const { logAudit } = require('../middleware/auditLogger');

// @desc    Get QR code for registration
// @route   GET /api/qrcode/:registrationId
// @access  Private
const getRegistrationQRCode = async (req, res) => {
  try {
    const { registrationId } = req.params;

    const registration = await Registration.findByPk(registrationId, {
      include: [
        { model: Event, attributes: ['title', 'venue', 'eventDate'] },
        { model: Student, attributes: ['fullName', 'rollNumber', 'email'] },
      ],
    });

    if (!registration) {
      return res.status(404).json({ message: 'Registration record not found' });
    }

    if (!registration.qrCodeUrl) {
      const payload = {
        registrationId: registration.id,
        eventId: registration.eventId,
        studentId: registration.studentId,
        rollNumber: registration.Student?.rollNumber,
      };
      registration.qrCodeUrl = await generateQRCode(payload);
      await registration.save();
    }

    res.json({
      registrationId: registration.id,
      qrCodeUrl: registration.qrCodeUrl,
      eventTitle: registration.Event?.title,
      studentName: registration.Student?.fullName,
      rollNumber: registration.Student?.rollNumber,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error retrieving QR code', error: error.message });
  }
};

// @desc    Scan QR Code to mark attendance automatically
// @route   POST /api/qrcode/scan
// @access  Private/Admin
const scanQRCode = async (req, res) => {
  try {
    const { qrData, registrationId: reqRegId } = req.body;
    let targetRegistrationId = reqRegId;

    if (!targetRegistrationId && qrData) {
      try {
        const parsed = typeof qrData === 'string' ? JSON.parse(qrData) : qrData;
        targetRegistrationId = parsed.registrationId;
      } catch (err) {
        return res.status(400).json({ message: 'Invalid QR Code payload format' });
      }
    }

    if (!targetRegistrationId) {
      return res.status(400).json({ message: 'Registration ID could not be resolved from scan' });
    }

    const registration = await Registration.findByPk(targetRegistrationId, {
      include: [
        { model: Student, attributes: ['id', 'fullName', 'rollNumber'] },
        { model: Event, attributes: ['id', 'title', 'organizer'] },
      ],
    });

    if (!registration) {
      return res.status(404).json({ message: 'Registration record not found for scanned QR code' });
    }

    if (registration.status === 'Cancelled') {
      return res.status(400).json({ message: 'Cannot mark attendance for a cancelled registration' });
    }

    // Check existing attendance record to prevent duplicate scans
    let attendance = await Attendance.findOne({ where: { registrationId: registration.id } });
    if (attendance && attendance.attendanceStatus === 'Present') {
      return res.status(400).json({
        message: 'Attendance already marked Present for this registration scan.',
        alreadyScanned: true,
        markedAt: attendance.markedAt,
      });
    }

    // Mark attendance Present
    if (!attendance) {
      attendance = await Attendance.create({
        registrationId: registration.id,
        eventId: registration.eventId,
        studentId: registration.studentId,
        attendanceStatus: 'Present',
        markedAt: new Date(),
      });
    } else {
      attendance.attendanceStatus = 'Present';
      attendance.markedAt = new Date();
      await attendance.save();
    }

    // Automatically issue participation certificate
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

    // Notify student
    await Notification.create({
      userId: registration.studentId,
      userRole: 'Student',
      title: 'Attendance Confirmed & Certificate Issued!',
      message: `Your attendance for "${registration.Event?.title}" was marked Present via QR Scan. Your participation certificate is ready for download.`,
      type: 'Certificate',
    });

    await logAudit({
      req,
      userId: req.user.id,
      userRole: 'Admin',
      action: 'QR_SCAN_ATTENDANCE',
      details: `Scanned registration #${registration.id} for ${registration.Student?.fullName}`,
    });

    res.json({
      message: 'Attendance marked Present successfully via QR scan!',
      attendance,
      studentName: registration.Student?.fullName,
      eventTitle: registration.Event?.title,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error processing QR scan', error: error.message });
  }
};

module.exports = {
  getRegistrationQRCode,
  scanQRCode,
};
