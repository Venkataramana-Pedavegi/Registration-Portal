const request = require('supertest');
const { sequelize, Student, Admin, AuditLog, TokenBlacklist } = require('../models');
const initDb = require('../utils/initDb');
const bcrypt = require('bcryptjs');

let app;
let server;

beforeAll(async () => {
  process.env.JWT_SECRET = 'security_test_secret_key';
  process.env.JWT_REFRESH_SECRET = 'security_test_refresh_secret';
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

describe('College Event System - Enterprise Security & Audit Tests', () => {
  let adminToken;
  let studentToken;
  let testStudentId;

  beforeAll(async () => {
    // Create admin user for testing
    await Admin.create({
      username: 'securityadmin',
      email: 'secadmin@college.edu',
      password: 'SecPassword123!',
      role: 'Admin',
    });

    // Login Admin
    const adminRes = await request(app)
      .post('/api/admin/login')
      .send({ email: 'secadmin@college.edu', password: 'SecPassword123!' });
    adminToken = adminRes.body.token;
  });

  test('Password Policy - Student registration rejects weak password', async () => {
    const res = await request(app)
      .post('/api/student/register')
      .send({
        fullName: 'Weak Pwd Student',
        rollNumber: 'SEC001',
        email: 'weakstudent@college.edu',
        department: 'Information Technology',
        year: '2nd Year',
        password: 'weak', // fails min length of 8 and caps/number/special rules
      });

    expect(res.status).toBe(400);
    expect(res.body.errors[0].msg || res.body.errors[0]).toContain('Password must be');
  });

  test('Password Policy - Rejects password reuse of last 5 passwords', async () => {
    // Register a valid student
    const regRes = await request(app)
      .post('/api/student/register')
      .send({
        fullName: 'History Test Student',
        rollNumber: 'SEC002',
        email: 'histstudent@college.edu',
        department: 'Information Technology',
        year: '2nd Year',
        password: 'StrongPwd123!', // Valid strong password
      });

    expect(regRes.status).toBe(201);
    testStudentId = regRes.body._id;
    studentToken = regRes.body.token;

    // Login student to get active profile session
    const loginRes = await request(app)
      .post('/api/student/login')
      .send({ email: 'histstudent@college.edu', password: 'StrongPwd123!' });
    const activeToken = loginRes.body.token;

    // Try to update password to the same current password
    const changeRes = await request(app)
      .put('/api/profile/password')
      .set('Authorization', `Bearer ${activeToken}`)
      .send({
        currentPassword: 'StrongPwd123!',
        newPassword: 'StrongPwd123!',
      });

    expect(changeRes.status).toBe(400);
    expect(changeRes.body.message).toContain('reuse any of your last 5');
  });

  test('Account Lockout - Locks account after 5 consecutive failed logins', async () => {
    // We try to log in to student account with incorrect password 5 times
    for (let i = 0; i < 4; i++) {
      const failRes = await request(app)
        .post('/api/student/login')
        .send({ email: 'histstudent@college.edu', password: 'wrongpassword' });
      expect(failRes.status).toBe(401);
    }

    // 5th failed attempt should trigger lockout message
    const lockoutRes = await request(app)
      .post('/api/student/login')
      .send({ email: 'histstudent@college.edu', password: 'wrongpassword' });

    expect(lockoutRes.status).toBe(401);
    expect(lockoutRes.body.message).toContain('locked');

    // 6th attempt should hit lockout check immediately and return 423
    const checkRes = await request(app)
      .post('/api/student/login')
      .send({ email: 'histstudent@college.edu', password: 'wrongpassword' });

    expect(checkRes.status).toBe(423);
    expect(checkRes.body.message).toContain('locked out');
  });

  test('JWT Revocation - Logout blacklists access token', async () => {
    // Create new login session to get a fresh token
    // First, let's remove lockout directly to allow login
    await Student.update({ lockoutUntil: null, failedLoginAttempts: 0 }, { where: { id: testStudentId } });

    const loginRes = await request(app)
      .post('/api/student/login')
      .send({ email: 'histstudent@college.edu', password: 'StrongPwd123!' });

    const activeToken = loginRes.body.token;

    // Call logout API
    const logoutRes = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${activeToken}`)
      .send();

    expect(logoutRes.status).toBe(200);

    // Verify token is now blacklisted, so GET profile returns 401
    const profileRes = await request(app)
      .get('/api/student/profile')
      .set('Authorization', `Bearer ${activeToken}`);

    expect(profileRes.status).toBe(401);
  });

  test('Audit Trail - Track login failures, successes, and browser/OS details', async () => {
    // Assert audit logs got created
    const logs = await AuditLog.findAll({
      order: [['createdAt', 'DESC']],
    });

    expect(logs.length).toBeGreaterThan(0);
    expect(logs.some(l => l.action === 'LOGIN' && l.status === 'SUCCESS')).toBe(true);
    expect(logs.some(l => l.action === 'REGISTRATION')).toBe(true);

    // Check device parsing (simulated headers in integration environment defaults to macOS/Chrome etc.)
    const checkLog = logs.find(l => l.action === 'LOGIN');
    expect(checkLog).toHaveProperty('browser');
    expect(checkLog).toHaveProperty('os');
  });
});
