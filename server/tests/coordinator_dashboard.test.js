const request = require('supertest');
const { app } = require('../server');
const { Student, Admin, Volunteer, sequelize } = require('../models');
const jwt = require('jsonwebtoken');

describe('Coordinator Dashboard Authorization & Non-Regression Suite', () => {
  let adminToken;
  let coordinatorToken;
  let studentToken;
  let adminUser;
  let coordinatorUser;
  let studentUser;

  beforeAll(async () => {
    // 1. Create Admin
    adminUser = await Admin.create({
      username: `admin_coord_${Date.now()}`,
      email: `admin_coord_${Date.now()}@college.edu`,
      password: 'password123',
      role: 'Admin',
      isActive: true,
      permissions: JSON.stringify(['Analytics', 'ManageEvents']),
    });
    adminToken = jwt.sign(
      { id: adminUser.id, role: 'Admin' },
      process.env.JWT_SECRET || 'fallback_secret_for_dev_only',
      { expiresIn: '1h' }
    );

    // 2. Create Coordinator
    coordinatorUser = await Admin.create({
      username: `coord_${Date.now()}`,
      email: `coord_${Date.now()}@college.edu`,
      password: 'password123',
      role: 'Coordinator',
      isActive: true,
      permissions: JSON.stringify(['Analytics', 'ManageEvents']),
    });
    coordinatorToken = jwt.sign(
      { id: coordinatorUser.id, role: 'Coordinator' },
      process.env.JWT_SECRET || 'fallback_secret_for_dev_only',
      { expiresIn: '1h' }
    );

    // 3. Create Normal Student
    studentUser = await Student.create({
      fullName: 'Normal Student',
      rollNumber: `STUCOORD_${Date.now().toString().slice(-6)}`,
      email: `student_coord_${Date.now()}@college.edu`,
      password: 'password123',
      department: 'Computer Science',
      year: '3rd Year',
      isVerified: true,
      isActive: true,
    });
    studentToken = jwt.sign(
      { id: studentUser.id, role: 'Student' },
      process.env.JWT_SECRET || 'fallback_secret_for_dev_only',
      { expiresIn: '1h' }
    );
  });

  afterAll(async () => {
    if (adminUser) await Admin.destroy({ where: { id: adminUser.id } });
    if (coordinatorUser) await Admin.destroy({ where: { id: coordinatorUser.id } });
    if (studentUser) await Student.destroy({ where: { id: studentUser.id } });
  });

  test('TEST 1: Admin can access Coordinator Dashboard API (GET /api/bi/dashboard)', async () => {
    const res = await request(app)
      .get('/api/bi/dashboard')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('kpis');
  });

  test('TEST 2: Coordinator can access Coordinator Dashboard API (GET /api/bi/dashboard)', async () => {
    const res = await request(app)
      .get('/api/bi/dashboard')
      .set('Authorization', `Bearer ${coordinatorToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('kpis');
  });

  test('TEST 3: Normal Student CANNOT access Coordinator Dashboard API (Returns HTTP 403 Access Denied)', async () => {
    const res = await request(app)
      .get('/api/bi/dashboard')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.statusCode).toBe(403);
    expect(res.body.message).toMatch(/access denied/i);
  });

  test('TEST 4: Non-Regression - Attendance remains 100% MANUAL', async () => {
    const res = await request(app)
      .post('/api/qrcode/scan')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ registrationId: 9999 });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/disabled|manual/i);
  });
});
