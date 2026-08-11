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

    // Force regeneration to use the new JSON format containing registrationId, eventId, and studentId
    const qrPayload = {
      registrationId: registration.id,
      eventId: registration.eventId,
      studentId: registration.studentId,
    };
    registration.qrCodeUrl = await generateQRCode(qrPayload);
    await registration.save();

    res.json({
      registrationId: registration.id,
      qrCodeUrl: registration.qrCodeUrl,
      eventTitle: registration.Event?.title,
      studentName: registration.Student?.fullName,
      rollNumber: registration.Student?.rollNumber,
      eventDate: registration.Event?.eventDate,
      venue: registration.Event?.venue,
      status: registration.status,
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
    return res.status(400).json({
      message: 'QR scanning for attendance is disabled. Please mark attendance via the Attendance Management page.'
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error processing QR scan', error: error.message });
  }
};

const getScannedRegistrationDetails = async (req, res) => {
  try {
    const { registrationId } = req.params;

    const registration = await Registration.findByPk(registrationId, {
      include: [
        { model: Event, attributes: ['id', 'title', 'venue', 'eventDate', 'startTime', 'endTime'] },
        { model: Student, attributes: ['id', 'fullName', 'rollNumber', 'email', 'department'] },
        { model: Attendance, attributes: ['attendanceStatus', 'markedAt'] },
      ],
    });

    if (!registration) {
      return res.status(404).json({
        isValid: false,
        message: 'Pass is invalid - No registration record found'
      });
    }

    // Determine QR validity
    let isValid = true;
    let message = 'Pass is valid';

    if (registration.status === 'Cancelled') {
      isValid = false;
      message = 'Pass is invalid - Registration has been cancelled';
    }

    res.json({
      isValid,
      message,
      passId: registration.id,
      studentId: registration.studentId,
      eventId: registration.eventId,
      studentName: registration.Student?.fullName,
      rollNumber: registration.Student?.rollNumber,
      email: registration.Student?.email,
      department: registration.Student?.department,
      eventName: registration.Event?.title,
      eventVenue: registration.Event?.venue,
      eventDate: registration.Event?.eventDate,
      registrationStatus: registration.status,
      attendanceStatus: registration.Attendance?.attendanceStatus || 'Absent',
      markedAt: registration.Attendance?.markedAt || null,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error verifying pass', error: error.message });
  }
};

module.exports = {
  getRegistrationQRCode,
  scanQRCode,
  getScannedRegistrationDetails,
};
