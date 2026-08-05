const request = require('supertest');
const { sequelize, Student, Admin, Leaderboard, Badge, StudentBadge, ActivityLog, Registration, Event } = require('../models');
const initDb = require('../utils/initDb');

let app;
let server;

beforeAll(async () => {
  process.env.JWT_SECRET = 'gamification_test_secret_key';
  process.env.JWT_REFRESH_SECRET = 'gamification_test_refresh_secret';
  await initDb();
  await sequelize.sync({ force: true });

  const backend = require('../server');
  app = backend.app;
  server = backend.server;
  
  await new Promise((resolve) => setTimeout(resolve, 500));
});

afterAll(async () => {
  await sequelize.close();
  await new Promise((resolve) => server.close(resolve));
});

describe('College Event System - Gamification & Engagement Tests', () => {
  let adminToken;
  let studentToken;
  let studentId;
  let referralCode;

  beforeAll(async () => {
    // 1. Create Admin
    await Admin.create({
      username: 'gameadmin',
      email: 'gameadmin@college.edu',
      password: 'SecPassword123!',
      role: 'Admin',
    });

    const adminRes = await request(app)
      .post('/api/admin/login')
      .send({ email: 'gameadmin@college.edu', password: 'SecPassword123!' });
    adminToken = adminRes.body.token;

    // Seed Badges catalog
    const { seedBadges } = require('../services/GamificationService');
    await seedBadges();

    // 2. Register Student
    const regRes = await request(app)
      .post('/api/student/register')
      .send({
        fullName: 'John Gamer',
        rollNumber: 'GME001',
        email: 'john.gamer@college.edu',
        department: 'CSE',
        year: '3rd Year',
        password: 'StrongPwd123!',
      });

    studentId = regRes.body._id;
    studentToken = regRes.body.token;

    // Fetch the registered student to get their referralCode
    const studentObj = await Student.findByPk(studentId);
    referralCode = studentObj.referralCode;
  });

  test('Registration assigns points (+10 XP) and logs activity', async () => {
    // 1. Create Event
    const eventRes = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Gamification Hackathon',
        description: 'Building premium gamified systems.',
        category: 'Technical',
        venue: 'Lab 3',
        eventDate: '2026-11-20',
        registrationDeadline: '2026-11-15',
        startTime: '10:00',
        endTime: '16:00',
        organizer: 'CSE Dept',
        capacity: 100,
      });

    const eventId = eventRes.body._id || eventRes.body.id;

    // 2. Register Student for Event
    const signupRes = await request(app)
      .post('/api/registrations')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ eventId });

    expect(signupRes.status).toBe(201);

    // 3. Verify points in student stats profile
    const statsRes = await request(app)
      .get('/api/gamification/profile-stats')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(statsRes.body.points).toBe(10);
    expect(statsRes.body.level).toBe('Beginner');
  });

  test('Referral signups award points to both referrer and referee (+15 XP)', async () => {
    const refereeRes = await request(app)
      .post('/api/student/register')
      .send({
        fullName: 'Dave Referee',
        rollNumber: 'REF001',
        email: 'dave.referee@college.edu',
        department: 'CSE',
        year: '3rd Year',
        password: 'StrongPwd125!',
        referredByCode: referralCode, // Referrer's code
      });

    expect(refereeRes.status).toBe(201);

    // 1. Verify Dave got +15 XP
    const refereeStats = await request(app)
      .get('/api/gamification/profile-stats')
      .set('Authorization', `Bearer ${refereeRes.body.token}`);

    expect(refereeStats.body.points).toBe(15);

    // 2. Verify John got +15 XP (total: 10 + 15 = 25 XP)
    const referrerStats = await request(app)
      .get('/api/gamification/profile-stats')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(referrerStats.body.points).toBe(25);
  });

  test('Admin Custom Badge creation and unlock validations', async () => {
    const badgeRes = await request(app)
      .post('/api/gamification/admin/badge')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Super Elite',
        description: 'Awarded to students with high engagement values.',
        ruleType: 'points',
        ruleValue: 500,
      });

    expect(badgeRes.status).toBe(201);
    expect(badgeRes.body.badge.name).toBe('Super Elite');
  });

  test('Admin points adjustment tool (award/revoke)', async () => {
    // Award +500 XP to trigger Level Up and Badge unlock
    const adjustRes = await request(app)
      .post('/api/gamification/admin/adjust-points')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        studentId,
        points: 500,
        description: 'Bonus points for winning national coding contest',
      });

    expect(adjustRes.status).toBe(200);
    expect(adjustRes.body.points).toBe(525);

    // Verify stats level changed (Gold class)
    const statsRes = await request(app)
      .get('/api/gamification/profile-stats')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(statsRes.body.level).toBe('Gold');
    expect(statsRes.body.progressPercentage).toBe(5); // 25 points into Gold (500 threshold, 1000 next, 25/500 = 5%)

    // Verify that John unlocked the badge "Super Elite" because points became 525 (>= 500 rule value)
    const badgesRes = await request(app)
      .get('/api/gamification/badges')
      .set('Authorization', `Bearer ${studentToken}`);

    const eliteBadge = badgesRes.body.find(b => b.name === 'Super Elite');
    expect(eliteBadge).toBeDefined();
    expect(eliteBadge.isUnlocked).toBe(true);
  });

  test('Leaderboard pagination, search, and sorting', async () => {
    const leaderRes = await request(app)
      .get('/api/leaderboard')
      .query({
        page: 1,
        limit: 2,
        sortBy: 'points',
        search: 'John',
      });

    expect(leaderRes.status).toBe(200);
    expect(leaderRes.body.rankings.length).toBeGreaterThan(0);
    expect(leaderRes.body.rankings[0].fullName).toContain('John');
  });

  test('Monthly ranking reset clears leaderboard points', async () => {
    const resetRes = await request(app)
      .post('/api/gamification/admin/reset-monthly')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(resetRes.status).toBe(200);

    const statsRes = await request(app)
      .get('/api/gamification/profile-stats')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(statsRes.body.points).toBe(0);
  });
});
