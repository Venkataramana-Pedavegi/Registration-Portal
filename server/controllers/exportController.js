const { Event, Registration, Student, Attendance } = require('../models');

// Helper to escape CSV values safely
const escapeCsv = (val) => {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
};

// @desc    Export Events report as CSV
// @route   GET /api/export/events
// @access  Private/Admin
const exportEvents = async (req, res) => {
  try {
    const events = await Event.findAll({
      order: [['createdAt', 'DESC']],
    });

    const headers = ['ID', 'Title', 'Category', 'Venue', 'Event Date', 'Start Time', 'End Time', 'Registration Deadline', 'Organizer', 'Capacity', 'Available Seats', 'Status'];
    const rows = events.map((ev) => [
      ev.id,
      escapeCsv(ev.title),
      escapeCsv(ev.category),
      escapeCsv(ev.venue),
      new Date(ev.eventDate).toLocaleDateString(),
      escapeCsv(ev.startTime),
      escapeCsv(ev.endTime),
      new Date(ev.registrationDeadline).toLocaleDateString(),
      escapeCsv(ev.organizer),
      ev.capacity,
      ev.availableSeats,
      escapeCsv(ev.status),
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="events_report.csv"');
    res.status(200).send(csvContent);
  } catch (error) {
    res.status(500).json({ message: 'Server error exporting events CSV', error: error.message });
  }
};

// @desc    Export Participants report as CSV
// @route   GET /api/export/participants
// @access  Private/Admin
const exportParticipants = async (req, res) => {
  try {
    const registrations = await Registration.findAll({
      include: [
        { model: Student, attributes: ['fullName', 'rollNumber', 'email', 'department', 'year'] },
        { model: Event, attributes: ['title', 'venue', 'eventDate'] },
      ],
      order: [['registrationDate', 'DESC']],
    });

    const headers = ['Registration ID', 'Student Name', 'Roll Number', 'Email', 'Department', 'Year', 'Event Title', 'Event Date', 'Venue', 'Registration Date', 'Status'];
    const rows = registrations.map((reg) => [
      reg.id,
      escapeCsv(reg.Student?.fullName),
      escapeCsv(reg.Student?.rollNumber),
      escapeCsv(reg.Student?.email),
      escapeCsv(reg.Student?.department),
      escapeCsv(reg.Student?.year),
      escapeCsv(reg.Event?.title),
      reg.Event ? new Date(reg.Event.eventDate).toLocaleDateString() : '',
      escapeCsv(reg.Event?.venue),
      new Date(reg.registrationDate).toLocaleDateString(),
      escapeCsv(reg.status),
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="participants_report.csv"');
    res.status(200).send(csvContent);
  } catch (error) {
    res.status(500).json({ message: 'Server error exporting participants CSV', error: error.message });
  }
};

// @desc    Export Attendance report as CSV
// @route   GET /api/export/attendance
// @access  Private/Admin
const exportAttendance = async (req, res) => {
  try {
    const attendanceRecords = await Attendance.findAll({
      include: [
        { model: Student, attributes: ['fullName', 'rollNumber', 'email', 'department', 'year'] },
        { model: Event, attributes: ['title', 'venue', 'eventDate'] },
      ],
      order: [['markedAt', 'DESC']],
    });

    const headers = ['Attendance ID', 'Registration ID', 'Student Name', 'Roll Number', 'Email', 'Department', 'Year', 'Event Title', 'Event Date', 'Attendance Status', 'Marked At'];
    const rows = attendanceRecords.map((att) => [
      att.id,
      att.registrationId,
      escapeCsv(att.Student?.fullName),
      escapeCsv(att.Student?.rollNumber),
      escapeCsv(att.Student?.email),
      escapeCsv(att.Student?.department),
      escapeCsv(att.Student?.year),
      escapeCsv(att.Event?.title),
      att.Event ? new Date(att.Event.eventDate).toLocaleDateString() : '',
      escapeCsv(att.attendanceStatus),
      new Date(att.markedAt).toLocaleString(),
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="attendance_report.csv"');
    res.status(200).send(csvContent);
  } catch (error) {
    res.status(500).json({ message: 'Server error exporting attendance CSV', error: error.message });
  }
};

module.exports = {
  exportEvents,
  exportParticipants,
  exportAttendance,
};
