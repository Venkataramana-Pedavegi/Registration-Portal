const { Leaderboard, Student, Attendance, Certificate, VolunteerTask, Volunteer, Registration, Badge, StudentBadge, ActivityLog, Notification, Event } = require('../models');
const { Op } = require('sequelize');

const LEVEL_THRESHOLDS = [
  { name: 'Beginner', minPoints: 0 },
  { name: 'Bronze', minPoints: 100 },
  { name: 'Silver', minPoints: 250 },
  { name: 'Gold', minPoints: 500 },
  { name: 'Platinum', minPoints: 1000 },
  { name: 'Diamond', minPoints: 2000 },
  { name: 'Elite', minPoints: 4000 },
  { name: 'Master', minPoints: 8000 }
];

const getLevelForPoints = (points) => {
  let currentLevel = LEVEL_THRESHOLDS[0];
  for (const lvl of LEVEL_THRESHOLDS) {
    if (points >= lvl.minPoints) {
      currentLevel = lvl;
    } else {
      break;
    }
  }
  return currentLevel;
};

// Seed default badges in the database
const seedBadges = async () => {
  const defaultBadges = [
    { name: 'First Event', description: 'Registered or attended your first campus event!', icon: 'Award', ruleType: 'first_event', ruleValue: 1 },
    { name: 'Event Explorer', description: 'Attended 3 events of different categories.', icon: 'Compass', ruleType: 'events_attended', ruleValue: 3 },
    { name: 'Active Participant', description: 'Attended 5 campus events.', icon: 'Flame', ruleType: 'events_attended', ruleValue: 5 },
    { name: 'Certificate Collector', description: 'Earned 3 participation certificates.', icon: 'FileBadge', ruleType: 'certificates', ruleValue: 3 },
    { name: 'Volunteer Hero', description: 'Completed 3 volunteer tasks.', icon: 'ShieldAlert', ruleType: 'volunteer_tasks', ruleValue: 3 },
    { name: 'Gold Volunteer', description: 'Completed 5 volunteer tasks.', icon: 'ShieldCheck', ruleType: 'volunteer_tasks', ruleValue: 5 },
    { name: 'Platinum Volunteer', description: 'Completed 10 volunteer tasks.', icon: 'Crown', ruleType: 'volunteer_tasks', ruleValue: 10 },
    { name: 'Campus Star', description: 'Accumulated 1000 engagement points.', icon: 'Star', ruleType: 'points', ruleValue: 1000 },
    { name: 'Event Champion', description: 'Won a competition event!', icon: 'Trophy', ruleType: 'competition_wins', ruleValue: 1 },
    { name: 'Tech Enthusiast', description: 'Attended 3 technology/coding events.', icon: 'Laptop', ruleType: 'custom', ruleValue: 3 },
    { name: 'Sports Champion', description: 'Attended or won a sports competition event.', icon: 'Activity', ruleType: 'custom', ruleValue: 3 },
    { name: 'Cultural Icon', description: 'Participated in 3 cultural events.', icon: 'Music', ruleType: 'custom', ruleValue: 3 },
    { name: 'Innovation Leader', description: 'Won 2 competition events.', icon: 'Lightbulb', ruleType: 'custom', ruleValue: 2 },
    { name: 'Community Builder', description: 'Referred 3 students to the events portal.', icon: 'Users', ruleType: 'custom', ruleValue: 3 }
  ];

  for (const badge of defaultBadges) {
    await Badge.findOrCreate({
      where: { name: badge.name },
      defaults: badge,
    });
  }
};

/**
 * Award points to a student, handle level-up and automatic badge evaluation.
 */
const awardPoints = async (studentId, points, type, description, referenceId = null, req = null) => {
  try {
    // 1. Get or create leaderboard entry
    let entry = await Leaderboard.findOne({ where: { studentId } });
    if (!entry) {
      entry = await Leaderboard.create({ studentId, points: 0, eventsAttended: 0, volunteerHours: 0 });
    }

    const pointsBefore = entry.points;
    const levelBefore = getLevelForPoints(pointsBefore);

    // 2. Update points (overall and dynamic reset trackers)
    entry.points = Math.max(0, entry.points + points);
    await entry.save();

    // 3. Log the activity
    await ActivityLog.create({
      studentId,
      type,
      pointsAwarded: points,
      description,
      referenceId,
    });

    const pointsAfter = entry.points;
    const levelAfter = getLevelForPoints(pointsAfter);

    // 4. Handle Level Up Trigger
    if (levelAfter.name !== levelBefore.name && points > 0) {
      await ActivityLog.create({
        studentId,
        type: 'LEVEL_UP',
        pointsAwarded: 0,
        description: `Leveled up to ${levelAfter.name}!`,
        referenceId: null,
      });

      await Notification.create({
        userId: studentId,
        userRole: 'Student',
        title: '🎉 Level Up Unlocked!',
        message: `Congratulations! You have reached level ${levelAfter.name}! Keep up the engagement.`,
        type: 'Badge', // standard notification type
      });
    }

    // 5. Evaluate and Unlock Badges
    await checkAndUnlockBadges(studentId, entry, req);

    return {
      points: entry.points,
      level: levelAfter.name,
      leveledUp: levelAfter.name !== levelBefore.name,
    };
  } catch (error) {
    console.error('Error awarding points in GamificationService:', error.message);
    throw error;
  }
};

/**
 * Audit student statistics and automatically unlock badges they are eligible for.
 */
const checkAndUnlockBadges = async (studentId, leaderboardEntry, req = null) => {
  try {
    // Gather statistics
    const eventsAttendedCount = await Attendance.count({
      where: { studentId, attendanceStatus: 'Present' }
    });

    const certCount = await Certificate.count({
      where: { studentId }
    });

    const volunteerTasksCount = await VolunteerTask.count({
      where: { status: 'completed' },
      include: [{ model: Volunteer, where: { studentId } }]
    });

    const competitionWinsCount = await Registration.count({
      where: { studentId, isWinner: true }
    });

    // Check categories attended
    const regs = await Registration.findAll({
      where: { studentId, status: 'Registered' },
      include: [{ model: Event, attributes: ['category'] }]
    });
    const categoriesExplored = new Set(regs.map(r => r.Event?.category).filter(Boolean));

    // Specific category counts
    const techCount = regs.filter(r => r.Event?.category?.toLowerCase().includes('tech') || r.Event?.category?.toLowerCase().includes('coding')).length;
    const sportsCount = regs.filter(r => r.Event?.category?.toLowerCase().includes('sport') || r.Event?.category?.toLowerCase().includes('athletic')).length;
    const culturalCount = regs.filter(r => r.Event?.category?.toLowerCase().includes('cultural') || r.Event?.category?.toLowerCase().includes('music') || r.Event?.category?.toLowerCase().includes('art')).length;

    // Referral Count
    const referralCount = await Student.count({
      where: { referredBy: studentId }
    });

    // Get all available badges
    const allBadges = await Badge.findAll();
    // Get currently unlocked badges
    const unlockedBadges = await StudentBadge.findAll({
      where: { studentId },
      attributes: ['badgeId']
    });
    const unlockedIds = new Set(unlockedBadges.map(ub => ub.badgeId));

    for (const badge of allBadges) {
      if (unlockedIds.has(badge.id)) continue;

      let eligible = false;

      switch (badge.ruleType) {
        case 'first_event':
          eligible = eventsAttendedCount >= 1 || regs.length >= 1;
          break;
        case 'events_attended':
          if (badge.name === 'Event Explorer') {
            eligible = categoriesExplored.size >= 3;
          } else {
            eligible = eventsAttendedCount >= badge.ruleValue;
          }
          break;
        case 'certificates':
          eligible = certCount >= badge.ruleValue;
          break;
        case 'volunteer_tasks':
          eligible = volunteerTasksCount >= badge.ruleValue;
          break;
        case 'points':
          eligible = leaderboardEntry.points >= badge.ruleValue;
          break;
        case 'competition_wins':
          eligible = competitionWinsCount >= badge.ruleValue;
          break;
        case 'custom':
          // Custom matches based on name rules
          if (badge.name === 'Tech Enthusiast') eligible = techCount >= 3;
          else if (badge.name === 'Sports Champion') eligible = sportsCount >= 3 || competitionWinsCount >= 1;
          else if (badge.name === 'Cultural Icon') eligible = culturalCount >= 3;
          else if (badge.name === 'Innovation Leader') eligible = competitionWinsCount >= 2;
          else if (badge.name === 'Community Builder') eligible = referralCount >= 3;
          break;
        default:
          break;
      }

      if (eligible) {
        // Unlock badge!
        await StudentBadge.create({
          studentId,
          badgeId: badge.id,
          earnedDate: new Date(),
        });

        // Log timeline event
        await ActivityLog.create({
          studentId,
          type: 'UNLOCK_BADGE',
          pointsAwarded: 0,
          description: `Unlocked badge: ${badge.name}`,
          referenceId: badge.id,
        });

        // Notify Student
        await Notification.create({
          userId: studentId,
          userRole: 'Student',
          title: '🏅 Badge Unlocked!',
          message: `Awesome job! You've unlocked the badge: "${badge.name}". Check it out on your achievements page.`,
          type: 'Badge',
        });
      }
    }
  } catch (err) {
    console.error('Error checking and unlocking badges:', err.message);
  }
};

module.exports = {
  seedBadges,
  awardPoints,
  checkAndUnlockBadges,
  getLevelForPoints,
  LEVEL_THRESHOLDS,
};
