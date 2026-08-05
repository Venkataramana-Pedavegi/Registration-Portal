const { Leaderboard, Student, Attendance, Certificate, Volunteer, VolunteerTask, Registration, Badge, StudentBadge, ActivityLog, Event } = require('../models');
const { Op } = require('sequelize');
const { getLevelForPoints, LEVEL_THRESHOLDS, awardPoints } = require('../services/GamificationService');

/**
 * Get student gamification metrics (Rank, XP, level, badges count)
 */
const getProfileStats = async (req, res) => {
  try {
    const studentId = req.user.id;

    // Find student details
    const student = await Student.findByPk(studentId, {
      attributes: ['id', 'fullName', 'department', 'year', 'profileImage'],
    });

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Get leaderboard entry
    let entry = await Leaderboard.findOne({ where: { studentId } });
    if (!entry) {
      entry = await Leaderboard.create({ studentId, points: 0, eventsAttended: 0, volunteerHours: 0 });
    }

    const currentPoints = entry.points;
    const levelObj = getLevelForPoints(currentPoints);

    // Calculate level index and next levels
    const currentLvlIndex = LEVEL_THRESHOLDS.findIndex(l => l.name === levelObj.name);
    const nextLevelObj = LEVEL_THRESHOLDS[currentLvlIndex + 1] || null;
    
    const prevLevelPoints = levelObj.minPoints;
    const nextLevelPoints = nextLevelObj ? nextLevelObj.minPoints : levelObj.minPoints;
    const progressPercentage = nextLevelObj 
      ? Math.max(0, Math.min(100, Math.round(((currentPoints - prevLevelPoints) / (nextLevelPoints - prevLevelPoints)) * 100))) 
      : 100;
    const remainingPoints = nextLevelObj ? Math.max(0, nextLevelPoints - currentPoints) : 0;

    // Calculate current rank dynamically (count how many students have more points)
    const rank = await Leaderboard.count({
      where: { points: { [Op.gt]: currentPoints } }
    }) + 1;

    // Calculate total registrations and attendance percentage
    const totalRegs = await Registration.count({
      where: { studentId, status: { [Op.ne]: 'Cancelled' } }
    });
    const presentAtt = await Attendance.count({
      where: { studentId, attendanceStatus: 'Present' }
    });
    const attendancePercentage = totalRegs > 0 ? Math.round((presentAtt / totalRegs) * 100) : 0;

    // Calculate volunteer hours
    const volunteers = await Volunteer.findAll({ where: { studentId, status: 'approved' } });
    const volunteerHours = volunteers.reduce((sum, v) => sum + (v.hours || 0), 0);

    // Count earned badges and certificates
    const badgesCount = await StudentBadge.count({ where: { studentId } });
    const certsCount = await Certificate.count({ where: { studentId } });

    res.json({
      student: {
        id: student.id,
        fullName: student.fullName,
        profileImage: student.profileImage,
        department: student.department,
        year: student.year,
      },
      points: currentPoints,
      level: levelObj.name,
      nextLevel: nextLevelObj ? nextLevelObj.name : 'Max Level reached',
      progressPercentage,
      remainingPoints,
      rank,
      attendancePercentage,
      volunteerHours,
      badgesCount,
      certsCount,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving profile stats', error: error.message });
  }
};

/**
 * Get student activity timeline log
 */
const getTimeline = async (req, res) => {
  try {
    const studentId = req.user.id;
    const logs = await ActivityLog.findAll({
      where: { studentId },
      order: [['createdAt', 'DESC']],
      limit: 30,
    });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving activity timeline', error: error.message });
  }
};

/**
 * Get student badges (locked and unlocked statuses)
 */
const getStudentBadges = async (req, res) => {
  try {
    const studentId = req.user.id;

    // Find all badges
    const allBadges = await Badge.findAll({
      order: [['isCustom', 'ASC'], ['id', 'ASC']]
    });

    // Find unlocked badges with dates
    const unlockedBadges = await StudentBadge.findAll({
      where: { studentId },
      include: [{ model: Badge }]
    });

    // Map unlocked badges to a fast lookup map
    const unlockedMap = {};
    unlockedBadges.forEach((ub) => {
      unlockedMap[ub.badgeId] = ub.earnedDate;
    });

    const result = allBadges.map((badge) => {
      const isUnlocked = !!unlockedMap[badge.id];
      return {
        id: badge.id,
        name: badge.name,
        description: badge.description,
        icon: badge.icon,
        isCustom: badge.isCustom,
        ruleType: badge.ruleType,
        ruleValue: badge.ruleValue,
        isUnlocked,
        earnedDate: isUnlocked ? unlockedMap[badge.id] : null,
      };
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving student badges', error: error.message });
  }
};

/**
 * Combined achievements dashboard helper
 */
const getAchievements = async (req, res) => {
  try {
    const studentId = req.user.id;

    const badges = await StudentBadge.findAll({
      where: { studentId },
      include: [{ model: Badge }],
      order: [['earnedDate', 'DESC']]
    });

    const certificates = await Certificate.findAll({
      where: { studentId },
      include: [{ model: Event, attributes: ['id', 'title', 'eventDate'] }],
      order: [['issueDate', 'DESC']]
    });

    const completedRegistrations = await Registration.findAll({
      where: { studentId, status: 'Registered' },
      include: [
        { model: Event, attributes: ['id', 'title', 'eventDate', 'category'] },
        { model: Attendance, where: { attendanceStatus: 'Present' } }
      ]
    });

    const timeline = await ActivityLog.findAll({
      where: { studentId },
      order: [['createdAt', 'DESC']],
      limit: 15,
    });

    res.json({
      badges,
      certificates,
      completedEventsCount: completedRegistrations.length,
      timeline,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving achievements summary', error: error.message });
  }
};

/**
 * Admin adjustments points award/revocation
 */
const adminAdjustPoints = async (req, res) => {
  try {
    const { studentId, points, description } = req.body;

    if (!studentId || points === undefined || !description) {
      return res.status(400).json({ message: 'Student ID, points modification, and reason description are required' });
    }

    const studentObj = await Student.findByPk(studentId);
    if (!studentObj) {
      return res.status(404).json({ message: 'Target student not found' });
    }

    const outcome = await awardPoints(
      studentId,
      Number(points),
      'POINTS_ADJUSTMENT',
      `Admin adjustment: ${description.trim()}`,
      null,
      req
    );

    res.json({
      message: `Points updated successfully. New total: ${outcome.points} XP (Level: ${outcome.level})`,
      studentId,
      points: outcome.points,
      level: outcome.level,
    });
  } catch (error) {
    res.status(500).json({ message: 'Admin points adjustment failure', error: error.message });
  }
};

/**
 * Admin custom badge creation
 */
const adminCreateCustomBadge = async (req, res) => {
  try {
    const { name, description, icon, ruleType, ruleValue } = req.body;

    if (!name || !description || !ruleType || ruleValue === undefined) {
      return res.status(400).json({ message: 'Badge name, description, rule type, and value are required' });
    }

    const [badge, created] = await Badge.findOrCreate({
      where: { name },
      defaults: {
        name,
        description,
        icon: icon || 'Award',
        ruleType,
        ruleValue: Number(ruleValue),
        isCustom: true,
      },
    });

    if (!created) {
      return res.status(400).json({ message: 'A badge with this name already exists' });
    }

    res.status(201).json({ message: 'Custom badge created successfully', badge });
  } catch (error) {
    res.status(500).json({ message: 'Error creating custom badge', error: error.message });
  }
};

const adminResetMonthlyRankings = async (req, res) => {
  try {
    await Leaderboard.update({ points: 0 }, { where: {} });
    
    // Log system reset in AuditLog
    const { AuditLog } = require('../models');
    await AuditLog.create({
      userId: req.user.id,
      userRole: req.role || 'Admin',
      action: 'LEADERBOARD_RESET',
      details: 'Monthly leaderboard points reset to 0 by Admin.',
    });

    res.json({ message: 'Monthly leaderboard rankings reset successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Error resetting monthly rankings', error: error.message });
  }
};

/**
 * Dynamic engagement analytics aggregates
 */
const adminGetAnalytics = async (req, res) => {
  try {
    // 1. Average Points
    const avgPointsObj = await Leaderboard.findAll({
      attributes: [[sequelize.fn('AVG', sequelize.col('points')), 'avgPoints']]
    });
    const avgPoints = avgPointsObj[0] ? Math.round(Number(avgPointsObj[0].getDataValue('avgPoints'))) : 0;

    // 2. Most Active Students (Top points earners)
    const topStudents = await Leaderboard.findAll({
      include: [{ model: Student, attributes: ['fullName', 'department', 'year'] }],
      order: [['points', 'DESC']],
      limit: 5,
    });

    // 3. Level Distribution counts
    const leaderboards = await Leaderboard.findAll({ attributes: ['points'] });
    const levelDist = {};
    LEVEL_THRESHOLDS.forEach((l) => { levelDist[l.name] = 0; });
    
    leaderboards.forEach((l) => {
      const lvl = getLevelForPoints(l.points);
      levelDist[lvl.name] = (levelDist[lvl.name] || 0) + 1;
    });

    // 4. Badge Distribution counts
    const badgeUnlocks = await StudentBadge.findAll({
      include: [{ model: Badge, attributes: ['name'] }]
    });
    const badgeDist = {};
    badgeUnlocks.forEach((ub) => {
      if (ub.Badge) {
        badgeDist[ub.Badge.name] = (badgeDist[ub.Badge.name] || 0) + 1;
      }
    });

    // 5. Active departments (average points by department)
    const allStudents = await Student.findAll({
      include: [{ model: Leaderboard, attributes: ['points'] }]
    });

    const deptPoints = {};
    allStudents.forEach((student) => {
      const dept = student.department || 'General';
      const pts = student.Leaderboard ? student.Leaderboard.points : 0;
      if (!deptPoints[dept]) deptPoints[dept] = { total: 0, count: 0 };
      deptPoints[dept].total += pts;
      deptPoints[dept].count += 1;
    });

    const deptAnalytics = Object.keys(deptPoints).map((dept) => ({
      department: dept,
      avgPoints: Math.round(deptPoints[dept].total / deptPoints[dept].count),
    })).sort((a, b) => b.avgPoints - a.avgPoints);

    res.json({
      avgPoints,
      topStudents,
      levelDistribution: levelDist,
      badgeDistribution: badgeDist,
      departmentRankings: deptAnalytics,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving engagement analytics', error: error.message });
  }
};

module.exports = {
  getProfileStats,
  getTimeline,
  getStudentBadges,
  getAchievements,
  adminAdjustPoints,
  adminCreateCustomBadge,
  adminResetMonthlyRankings,
  adminGetAnalytics,
};
