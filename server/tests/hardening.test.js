const request = require('supertest');
const { sequelize, Admin, Student, Event, Registration, Attendance } = require('../models');
const initDb = require('../utils/initDb');

let app;
let server;

beforeAll(async () => {
  process.env.JWT_SECRET = 'hardening_test_secret_key';
  
  await initDb();
  await sequelize.sync({ force: true });
  
  // Seed Admin
  await Admin.create({
    username: 'admin',
    email: 'admin@college.edu',
    password: 'adminpassword',
    role: 'Admin',
  });

  const backend = require('../server');
  app = backend.app;
  server = backend.server;
  
  await new Promise((resolve) => setTimeout(resolve, 500));
});

afterAll(async () => {
  await sequelize.close();
  await new Promise((resolve) => server.close(resolve));
});

describe('College Event System - Hardening & Security Edge Case Tests', () => {
  let adminToken;
  let studentToken;
  let studentId;
  let zeroSeatEventId;

  beforeAll(async () => {
    // Admin login
    const adminRes = await request(app)
      .post('/api/admin/login')
      .send({ email: 'admin@college.edu', password: 'adminpassword' });
    adminToken = adminRes.body.token;

    // Register Student
    const studentRes = await request(app)
      .post('/api/student/register')
      .send({
        fullName: 'Hardening Test Student',
        rollNumber: 'CS2026777',
        email: 'hardening@college.edu',
        department: 'Computer Science',
        year: '4th Year',
        password: 'password123',
      });
    studentToken = studentRes.body.token;
    studentId = studentRes.body._id;

    // Create 1-seat Event
    const eventRes = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Single Seat Workshop',
        description: 'Testing seat capacity boundary limits.',
        category: 'Workshop',
        venue: 'Lab 1',
        eventDate: '2026-12-15',
        startTime: '10:00',
        endTime: '12:00',
        registrationDeadline: '2026-12-14',
        organizer: 'Testing Cell',
        capacity: 1,
      });
    zeroSeatEventId = eventRes.body._id;
  });

  // 1. Form Validation Edge Cases
  test('POST /api/student/register - Reject invalid email format', async () => {
    const res = await request(app)
      .post('/api/student/register')
      .send({
        fullName: 'Invalid Email Student',
        rollNumber: 'CS2026778',
        email: 'invalid-email-format',
        department: 'CS',
        year: '1st Year',
        password: 'password123',
      });

    expect(res.status).toBe(400);
  });

  test('POST /api/student/register - Reject weak password (< 6 chars)', async () => {
    const res = await request(app)
      .post('/api/student/register')
      .send({
        fullName: 'Weak Pass Student',
        rollNumber: 'CS2026779',
        email: 'weakpass@college.edu',
        department: 'CS',
        year: '1st Year',
        password: '123',
      });

    expect(res.status).toBe(400);
  });

  // 2. SQL Injection & XSS Input Handling
  test('POST /api/student/login - SQL Injection payloads safely rejected', async () => {
    const res = await request(app)
      .post('/api/student/login')
      .send({
        email: "' OR '1'='1",
        password: "' OR '1'='1",
      });

    expect([400, 401]).toContain(res.status);
  });

  // 3. Seat Capacity Exceeded Boundary Test
  test('POST /api/registrations - Register seat 1 of 1 (Success)', async () => {
    const res = await request(app)
      .post('/api/registrations')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ eventId: zeroSeatEventId });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('Registered');
  });

  test('POST /api/registrations - Register when event is FULL (Reject 400)', async () => {
    // Create second student
    const student2Res = await request(app)
      .post('/api/student/register')
      .send({
        fullName: 'Second Student',
        rollNumber: 'CS2026780',
        email: 'student2@college.edu',
        department: 'CS',
        year: '2nd Year',
        password: 'password123',
      });

    const res = await request(app)
      .post('/api/registrations')
      .set('Authorization', `Bearer ${student2Res.body.token}`)
      .send({ eventId: zeroSeatEventId });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/no available seats/i);
  });

  // 4. Duplicate Registration Guard
  test('POST /api/registrations - Prevent duplicate registration by same student', async () => {
    const res = await request(app)
      .post('/api/registrations')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ eventId: zeroSeatEventId });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/already registered/i);
  });

  // 5. Invalid / Tampered Token Guard
  test('GET /api/admin/dashboard - Reject invalid JWT token', async () => {
    const res = await request(app)
      .get('/api/admin/dashboard')
      .set('Authorization', 'Bearer invalid_tampered_jwt_token');

    expect(res.status).toBe(401);
  });
});
