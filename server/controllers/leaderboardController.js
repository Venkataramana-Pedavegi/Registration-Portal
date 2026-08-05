const { Op } = require('sequelize');
const { Leaderboard, Student, Attendance, Volunteer, VolunteerTask, Registration, Certificate } = require('../models');
const { getLevelForPoints } = require('../services/GamificationService');

const getLeaderboard = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 10);
    const sortBy = req.query.sortBy || 'points'; // 'points', 'volunteer', 'certificates', 'events', 'attendance'
    const department = req.query.department;
    const year = req.query.year;
    const timeframe = req.query.timeframe || 'overall'; // 'monthly', 'yearly', 'overall'

    // Build timeframe date clause
    const dateClause = {};
    if (timeframe === 'monthly') {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      dateClause.createdAt = { [Op.gte]: startOfMonth };
    } else if (timeframe === 'yearly') {
      const startOfYear = new Date();
      startOfYear.setMonth(0, 1);
      startOfYear.setHours(0, 0, 0, 0);
      dateClause.createdAt = { [Op.gte]: startOfYear };
    }

    // Build student filter clause
    const studentFilter = {};
    if (department) studentFilter.department = department;
    if (year) studentFilter.year = year;
    if (req.query.search) {
      studentFilter.fullName = { [Op.like]: `%${req.query.search.trim()}%` };
    }

    // Fetch all matching students
    const students = await Student.findAll({
      where: studentFilter,
      attributes: ['id', 'fullName', 'email', 'department', 'year', 'profileImage'],
    });

    const leaderboardData = await Promise.all(
      students.map(async (student) => {
        let entry = await Leaderboard.findOne({ where: { studentId: student.id } });
        if (!entry) {
          entry = await Leaderboard.create({
            studentId: student.id,
            points: 0,
            eventsAttended: 0,
            volunteerHours: 0,
          });
        }

        // Calculate counts based on timeframe date filters
        const regCount = await Registration.count({
          where: { studentId: student.id, status: 'Registered', ...dateClause },
        });

        const attCount = await Attendance.count({
          where: { studentId: student.id, attendanceStatus: 'Present', ...dateClause },
        });

        const certCount = await Certificate.count({
          where: { studentId: student.id, ...dateClause },
        });

        const volunteerTasksCount = await VolunteerTask.count({
          where: { status: 'completed', ...dateClause },
          include: [{ model: Volunteer, where: { studentId: student.id } }],
        });

        // Resolve volunteer hours
        const volunteers = await Volunteer.findAll({
          where: { studentId: student.id, status: 'approved' },
        });
        const volunteerHours = volunteers.reduce((sum, v) => sum + (v.hours || 0), 0);

        // Fetch points
        const points = entry.points;
        const levelObj = getLevelForPoints(points);

        return {
          studentId: student.id,
          fullName: student.fullName,
          email: student.email,
          department: student.department,
          year: student.year,
          profileImage: student.profileImage,
          points,
          level: levelObj.name,
          volunteerHours,
          volunteerTasksCount,
          regCount,
          attCount,
          certCount,
        };
      })
    );

    // Apply sorting
    leaderboardData.sort((a, b) => {
      if (sortBy === 'volunteer') {
        return b.volunteerHours - a.volunteerHours || b.points - a.points;
      } else if (sortBy === 'certificates') {
        return b.certCount - a.certCount || b.points - a.points;
      } else if (sortBy === 'events') {
        return b.regCount - a.regCount || b.points - a.points;
      } else if (sortBy === 'attendance') {
        return b.attCount - a.attCount || b.points - a.points;
      } else {
        // default: points
        return b.points - a.points;
      }
    });

    // Pagination calculations
    const totalCount = leaderboardData.length;
    const totalPages = Math.ceil(totalCount / limit);
    const offset = (page - 1) * limit;
    const paginatedRankings = leaderboardData.slice(offset, offset + limit);

    // Add rank fields to rankings
    const rankingsWithRank = paginatedRankings.map((item, index) => ({
      ...item,
      rank: offset + index + 1,
    }));

    res.json({
      rankings: rankingsWithRank,
      pagination: {
        page,
        totalPages,
        totalCount,
        limit,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching leaderboard metrics', error: error.message });
  }
};

const getStudentStats = async (req, res) => {
  try {
    const studentId = req.user.id;
    const student = await Student.findByPk(studentId);
    if (!student) return res.status(404).json({ message: 'Student not found' });

    let entry = await Leaderboard.findOne({
      where: { studentId },
    });

    if (!entry) {
      entry = await Leaderboard.create({
        studentId,
        points: 0,
        eventsAttended: 0,
        volunteerHours: 0,
      });
    }

    const levelObj = getLevelForPoints(entry.points);
    const plain = entry.toJSON();
    plain.level = levelObj.name;
    res.json(plain);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getLeaderboard,
  getStudentStats,
};
