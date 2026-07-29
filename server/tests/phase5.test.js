const request = require('supertest');
const { sequelize, Admin, Student, Event, Registration, Attendance, Certificate, Notification, AuditLog } = require('../models');
const initDb = require('../utils/initDb');

let app;
let server;

beforeAll(async () => {
  process.env.JWT_SECRET = 'phase5_test_secret_key';
  
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

describe('College Event Registration Phase 5 Enterprise APIs', () => {
  let adminToken;
  let studentToken;
  let studentId;
  let eventId;
  let registrationId;
  let certId;

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
        fullName: 'Phase 5 Test Student',
        rollNumber: 'CS2026555',
        email: 'phase5@college.edu',
        department: 'Information Technology',
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
        title: 'Phase 5 Security Conference',
        description: 'Enterprise security & cloud architecture.',
        category: 'Conference',
        venue: 'Main Auditorium',
        eventDate: '2026-12-10',
        startTime: '09:00',
        endTime: '17:00',
        registrationDeadline: '2026-12-05',
        organizer: 'Cybersecurity Cell',
        capacity: 50,
      });
    eventId = eventRes.body._id;

    // 4. Student Register for Event
    const regRes = await request(app)
      .post('/api/registrations')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ eventId });
    registrationId = regRes.body.id;
  });

  // 1. Profile Management
  test('PUT /api/profile - Update Student profile details', async () => {
    const res = await request(app)
      .put('/api/profile')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        fullName: 'Updated Phase5 Student',
        department: 'Computer Science',
      });

    expect(res.status).toBe(200);
    expect(res.body.fullName).toBe('Updated Phase5 Student');
    expect(res.body.department).toBe('Computer Science');
  });

  test('POST /api/profile/upload - Upload Profile Image', async () => {
    const res = await request(app)
      .post('/api/profile/upload')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        imageUrl: 'https://example.com/avatar.png',
      });

    expect(res.status).toBe(200);
    expect(res.body.profileImage).toBe('https://example.com/avatar.png');
  });

  // 2. Forgot & Reset Password
  test('POST /api/auth/forgot-password - Trigger password reset token', async () => {
    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'phase5@college.edu' });

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/link has been sent/i);
  });

  // 3. QR Code System & Attendance Scan
  test('GET /api/qrcode/:registrationId - Retrieve student registration QR Code', async () => {
    const res = await request(app)
      .get(`/api/qrcode/${registrationId}`)
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.qrCodeUrl).toMatch(/^data:image/);
  });

  test('POST /api/qrcode/scan - Admin scan QR code to mark attendance Present', async () => {
    const res = await request(app)
      .post('/api/qrcode/scan')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ registrationId });

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/attendance marked Present/i);
  });

  test('POST /api/qrcode/scan - Prevent duplicate QR scan', async () => {
    const res = await request(app)
      .post('/api/qrcode/scan')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ registrationId });

    expect(res.status).toBe(400);
    expect(res.body.alreadyScanned).toBe(true);
  });

  // 4. Certificate Generation & PDF Download
  test('GET /api/certificates - Student list issued certificates', async () => {
    const res = await request(app)
      .get('/api/certificates')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    certId = res.body[0].id;
  });

  test('GET /api/certificates/:id/download - Download PDF Certificate', async () => {
    const res = await request(app)
      .get(`/api/certificates/${certId}/download`)
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/application\/pdf/i);
  });

  // 5. Notifications
  test('GET /api/notifications - List user notifications', async () => {
    const res = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('notifications');
    expect(res.body).toHaveProperty('unreadCount');
    expect(Array.isArray(res.body.notifications)).toBe(true);
  });

  test('PUT /api/notifications/read - Mark notifications as read', async () => {
    const res = await request(app)
      .put('/api/notifications/read')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({});

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/marked as read/i);
  });

  // 6. Security Audit Logs
  test('GET /api/auditlogs - Admin fetch security audit logs', async () => {
    const res = await request(app)
      .get('/api/auditlogs')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('auditLogs');
    expect(Array.isArray(res.body.auditLogs)).toBe(true);
    expect(res.body.auditLogs.length).toBeGreaterThan(0);
  });
});
