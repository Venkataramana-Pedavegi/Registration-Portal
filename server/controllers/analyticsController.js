const { Op, fn, col, literal } = require('sequelize');
const { Student, Event, Registration, Attendance, Admin } = require('../models');

// @desc    Get complete 10-card Admin Dashboard metrics
// @route   GET /api/admin/dashboard
// @access  Private/Admin
const getAdminDashboard = async (req, res) => {
  try {
    const totalStudents = await Student.count();
    const totalEvents = await Event.count();
    const totalRegistrations = await Registration.count();
    const activeRegistrations = await Registration.count({ where: { status: 'Registered' } });
    const cancelledRegistrations = await Registration.count({ where: { status: 'Cancelled' } });
    const completedEvents = await Event.count({ where: { status: 'Completed' } });
    const upcomingEvents = await Event.count({ where: { status: 'Upcoming' } });

    const activeEventsList = await Event.findAll({
      where: { status: { [Op.in]: ['Upcoming', 'Ongoing'] } },
      attributes: ['capacity', 'availableSeats'],
    });

    let seatsFilled = 0;
    let totalCapacity = 0;
    let availableSeats = 0;

    activeEventsList.forEach((ev) => {
      seatsFilled += (ev.capacity - ev.availableSeats);
      totalCapacity += ev.capacity;
      availableSeats += ev.availableSeats;
    });

    const eventOccupancyPct = totalCapacity > 0 ? Math.round((seatsFilled / totalCapacity) * 100) : 0;

    res.json({
      totalStudents,
      totalEvents,
      totalRegistrations,
      activeRegistrations,
      cancelledRegistrations,
      completedEvents,
      upcomingEvents,
      seatsFilled,
      availableSeats,
      eventOccupancyPct,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error retrieving dashboard metrics', error: error.message });
  }
};

// @desc    Get 5 Recharts Chart datasets
// @route   GET /api/admin/analytics
// @access  Private/Admin
const getAdminAnalytics = async (req, res) => {
  try {
    // 1. Registrations Per Event (Bar Chart)
    const events = await Event.findAll({
      attributes: ['id', 'title', 'capacity', 'availableSeats'],
      include: [
        {
          model: Registration,
          where: { status: 'Registered' },
          required: false,
          attributes: ['id'],
        },
      ],
    });

    const registrationsPerEvent = events.map((ev) => ({
      eventId: ev.id,
      eventTitle: ev.title.length > 15 ? ev.title.substring(0, 15) + '...' : ev.title,
      fullTitle: ev.title,
      registrationsCount: ev.Registrations ? ev.Registrations.length : 0,
      capacity: ev.capacity,
    }));

    // 2. Event Category Distribution (Pie Chart)
    const categoryCounts = await Event.findAll({
      attributes: ['category', [fn('COUNT', col('id')), 'count']],
      group: ['category'],
      raw: true,
    });

    const categoryDistribution = categoryCounts.map((item) => ({
      category: item.category,
      count: parseInt(item.count, 10),
    }));

    // 3. Monthly Registrations (Line Chart)
    const monthlyRaw = await Registration.findAll({
      attributes: [
        [fn('DATE_FORMAT', col('registrationDate'), '%Y-%m'), 'month'],
        [fn('COUNT', col('id')), 'count'],
      ],
      group: [fn('DATE_FORMAT', col('registrationDate'), '%Y-%m')],
      order: [[fn('DATE_FORMAT', col('registrationDate'), '%Y-%m'), 'ASC']],
      raw: true,
    });

    const monthlyRegistrations = monthlyRaw.map((item) => ({
      month: item.month || 'Current',
      count: parseInt(item.count, 10),
    }));

    // 4. Department-wise Registrations (Bar Chart)
    const deptRaw = await Registration.findAll({
      include: [
        {
          model: Student,
          attributes: ['department'],
          required: true,
        },
      ],
      attributes: ['Student.department'],
    });

    const deptMap = {};
    deptRaw.forEach((reg) => {
      const dept = reg.Student ? reg.Student.department : 'Unknown';
      deptMap[dept] = (deptMap[dept] || 0) + 1;
    });

    const departmentDistribution = Object.keys(deptMap).map((dept) => ({
      department: dept,
      count: deptMap[dept],
    }));

    // 5. Event Status Distribution (Donut Chart)
    const statusCounts = await Event.findAll({
      attributes: ['status', [fn('COUNT', col('id')), 'count']],
      group: ['status'],
      raw: true,
    });

    const statusDistribution = statusCounts.map((item) => ({
      status: item.status,
      count: parseInt(item.count, 10),
    }));

    res.json({
      registrationsPerEvent,
      categoryDistribution,
      monthlyRegistrations,
      departmentDistribution,
      statusDistribution,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error retrieving analytics data', error: error.message });
  }
};

// @desc    Get detailed Event Performance Reports
// @route   GET /api/admin/reports
// @access  Private/Admin
const getAdminReports = async (req, res) => {
  try {
    const events = await Event.findAll({
      include: [
        {
          model: Registration,
          include: [{ model: Attendance }],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    const reports = events.map((ev) => {
      const totalCapacity = ev.capacity;
      const filledSeats = ev.capacity - ev.availableSeats;
      const availableSeats = ev.availableSeats;

      const regList = ev.Registrations || [];
      const activeRegs = regList.filter((r) => r.status === 'Registered');
      const cancelledRegs = regList.filter((r) => r.status === 'Cancelled');

      let presentCount = 0;
      activeRegs.forEach((r) => {
        if (r.Attendance && r.Attendance.attendanceStatus === 'Present') {
          presentCount++;
        }
      });

      const registrationPct = totalCapacity > 0 ? Math.round((filledSeats / totalCapacity) * 100) : 0;
      const attendancePct = activeRegs.length > 0 ? Math.round((presentCount / activeRegs.length) * 100) : 0;
      const cancelledPct = regList.length > 0 ? Math.round((cancelledRegs.length / regList.length) * 100) : 0;
      const completionPct = ev.status === 'Completed' ? 100 : ev.status === 'Upcoming' ? 0 : 50;

      return {
        id: ev.id,
        _id: ev.id,
        title: ev.title,
        category: ev.category,
        venue: ev.venue,
        eventDate: ev.eventDate,
        status: ev.status,
        capacity: totalCapacity,
        filledSeats,
        availableSeats,
        totalRegistrations: activeRegs.length,
        cancelledCount: cancelledRegs.length,
        presentCount,
        registrationPct,
        attendancePct,
        cancelledPct,
        completionPct,
      };
    });

    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: 'Server error retrieving reports', error: error.message });
  }
};

// @desc    Get detailed student profile and event history for admin
// @route   GET /api/student/:id/profile
// @access  Private/Admin
const getStudentProfile = async (req, res) => {
  try {
    const { id } = req.params;

    if (isNaN(id) || !Number.isInteger(Number(id))) {
      return res.status(400).json({ message: 'Invalid Student ID format' });
    }

    const student = await Student.findByPk(id, {
      attributes: { exclude: ['password'] },
    });

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const registrations = await Registration.findAll({
      where: { studentId: id },
      include: [
        { model: Event },
        { model: Attendance },
      ],
      order: [['registrationDate', 'DESC']],
    });

    const activeSignups = registrations.filter((r) => r.status === 'Registered');
    const completedEvents = registrations.filter((r) => r.status === 'Completed' || (r.status === 'Registered' && r.Event && r.Event.status === 'Completed'));
    const cancelledSignups = registrations.filter((r) => r.status === 'Cancelled');
    
    let attendancePresent = 0;
    registrations.forEach((r) => {
      if (r.Attendance && r.Attendance.attendanceStatus === 'Present') attendancePresent++;
    });

    const attendancePct = activeSignups.length > 0 ? Math.round((attendancePresent / activeSignups.length) * 100) : 0;

    const formattedStudent = student.toJSON();
    formattedStudent._id = formattedStudent.id;

    res.json({
      student: formattedStudent,
      stats: {
        totalRegistrations: registrations.length,
        activeRegistrations: activeSignups.length,
        completedEventsCount: completedEvents.length,
        cancelledCount: cancelledSignups.length,
        attendancePercentage: attendancePct,
      },
      registrations: registrations.map((r) => {
        const plain = r.toJSON();
        plain._id = plain.id;
        if (plain.Event) plain.Event._id = plain.Event.id;
        if (plain.Attendance) plain.Attendance._id = plain.Attendance.id;
        return plain;
      }),
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error retrieving student profile', error: error.message });
  }
};

module.exports = {
  getAdminDashboard,
  getAdminAnalytics,
  getAdminReports,
  getStudentProfile,
};
