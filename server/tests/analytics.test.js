const request = require('supertest');
const { sequelize, Admin, Student, Event, Registration, Attendance } = require('../models');
const initDb = require('../utils/initDb');

let app;
let server;

beforeAll(async () => {
  process.env.JWT_SECRET = 'analytics_test_secret_key';
  
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

describe('College Event Registration Analytics & Management APIs', () => {
  let adminToken;
  let studentToken;
  let studentId;
  let eventId;
  let registrationId;
  let attendanceId;

  beforeAll(async () => {
    // 1. Admin login
    const adminRes = await request(app)
      .post('/api/admin/login')
      .send({ email: 'admin@college.edu', password: 'adminpassword' });
    adminToken = adminRes.body.token;

    // 2. Student Register
    const studentRes = await request(app)
      .post('/api/student/register')
      .send({
        fullName: 'Analytics Test Student',
        rollNumber: 'CS2026889',
        email: 'analytics@college.edu',
        department: 'Computer Science',
        year: '4th Year',
        password: 'password123',
      });
    studentToken = studentRes.body.token;
    studentId = studentRes.body._id;

    // 3. Create Event
    const eventRes = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Analytics Workshop 2026',
        description: 'Deep dive into data & charts.',
        category: 'Seminar',
        venue: 'Lab 4',
        eventDate: '2026-12-01',
        startTime: '10:00',
        endTime: '13:00',
        registrationDeadline: '2026-11-28',
        organizer: 'Data Club',
        capacity: 40,
      });
    eventId = eventRes.body._id;

    // 4. Student Register for Event
    const regRes = await request(app)
      .post('/api/registrations')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ eventId });
    registrationId = regRes.body.id;
  });

  // 1. Admin Dashboard 10-Card Metrics
  test('GET /api/admin/dashboard - Retrieve 10-card metrics', async () => {
    const res = await request(app)
      .get('/api/admin/dashboard')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('totalStudents');
    expect(res.body).toHaveProperty('totalEvents');
    expect(res.body).toHaveProperty('totalRegistrations');
    expect(res.body).toHaveProperty('activeRegistrations');
    expect(res.body).toHaveProperty('cancelledRegistrations');
    expect(res.body).toHaveProperty('completedEvents');
    expect(res.body).toHaveProperty('upcomingEvents');
    expect(res.body).toHaveProperty('seatsFilled');
    expect(res.body).toHaveProperty('availableSeats');
    expect(res.body).toHaveProperty('eventOccupancyPct');
  });

  // 2. Recharts Analytics Data
  test('GET /api/admin/analytics - Retrieve 5 chart aggregations', async () => {
    const res = await request(app)
      .get('/api/admin/analytics')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('registrationsPerEvent');
    expect(res.body).toHaveProperty('categoryDistribution');
    expect(res.body).toHaveProperty('monthlyRegistrations');
    expect(res.body).toHaveProperty('departmentDistribution');
    expect(res.body).toHaveProperty('statusDistribution');
    expect(Array.isArray(res.body.registrationsPerEvent)).toBe(true);
  });

  // 3. Event Reports
  test('GET /api/admin/reports - Retrieve event performance reports', async () => {
    const res = await request(app)
      .get('/api/admin/reports')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0]).toHaveProperty('registrationPct');
    expect(res.body[0]).toHaveProperty('attendancePct');
  });

  // 4. Mark & View Attendance
  test('POST /api/attendance - Admin mark attendance Present', async () => {
    const res = await request(app)
      .post('/api/attendance')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        registrationId,
        attendanceStatus: 'Present',
      });

    expect(res.status).toBe(201);
    expect(res.body.attendanceStatus).toBe('Present');
    attendanceId = res.body._id;
  });

  test('PUT /api/attendance/:id - Admin update attendance Absent', async () => {
    const res = await request(app)
      .put(`/api/attendance/${attendanceId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        attendanceStatus: 'Absent',
      });

    expect(res.status).toBe(200);
    expect(res.body.attendanceStatus).toBe('Absent');
  });

  test('GET /api/attendance/event/:eventId - Retrieve event attendance list', async () => {
    const res = await request(app)
      .get(`/api/attendance/event/${eventId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('stats');
    expect(res.body.stats.absentCount).toBe(1);
    expect(Array.isArray(res.body.participants)).toBe(true);
  });

  // 5. Admin View Student Profile
  test('GET /api/student/:id/profile - Admin lookup student profile', async () => {
    const res = await request(app)
      .get(`/api/student/${studentId}/profile`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.student.email).toBe('analytics@college.edu');
    expect(res.body).toHaveProperty('stats');
    expect(Array.isArray(res.body.registrations)).toBe(true);
  });

  // 6. CSV File Exports
  test('GET /api/export/events - Export events CSV', async () => {
    const res = await request(app)
      .get('/api/export/events')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/csv/i);
  });

  test('GET /api/export/participants - Export participants CSV', async () => {
    const res = await request(app)
      .get('/api/export/participants')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/csv/i);
  });

  test('GET /api/export/attendance - Export attendance CSV', async () => {
    const res = await request(app)
      .get('/api/export/attendance')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/csv/i);
  });
});
