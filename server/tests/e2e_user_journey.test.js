const request = require('supertest');
const { sequelize, Admin, Student, Event, Registration, Attendance, Certificate, Notification, AuditLog } = require('../models');
const initDb = require('../utils/initDb');

let app;
let server;

beforeAll(async () => {
  process.env.JWT_SECRET = 'e2e_release_audit_secret_key';
  
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

describe('E2E User Journey Simulation & Production Release Audit', () => {
  let adminToken;
  let studentToken;
  let studentId;
  let eventId;
  let registrationId;
  let certId;

  // Journey 1: Admin Authentication & Event Management
  test('Journey 1: Admin Login & Event Lifecycle Creation', async () => {
    const loginRes = await request(app)
      .post('/api/admin/login')
      .send({ email: 'admin@college.edu', password: 'adminpassword' });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body).toHaveProperty('token');
    adminToken = loginRes.body.token;

    // Create Event (Capacity: 10)
    const createEventRes = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'E2E Annual Hackathon 2026',
        description: 'Comprehensive software building hackathon.',
        category: 'Hackathon',
        venue: 'Grand Auditorium',
        eventDate: '2026-12-25',
        startTime: '09:00',
        endTime: '18:00',
        registrationDeadline: '2026-12-20',
        organizer: 'Innovation Lab',
        capacity: 10,
      });

    expect(createEventRes.status).toBe(201);
    expect(createEventRes.body.availableSeats).toBe(10);
    eventId = createEventRes.body._id;

    // Edit Event
    const editEventRes = await request(app)
      .put(`/api/events/${eventId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'E2E Annual Hackathon 2026',
        description: 'Comprehensive software building hackathon.',
        category: 'Hackathon',
        venue: 'Grand Auditorium - Hall A',
        eventDate: '2026-12-25',
        startTime: '09:00',
        endTime: '18:00',
        registrationDeadline: '2026-12-20',
        organizer: 'Innovation Lab',
        capacity: 10,
      });

    expect(editEventRes.status).toBe(200);
    expect(editEventRes.body.venue).toBe('Grand Auditorium - Hall A');
  });

  // Journey 2: Student Registration, Login & Event Signup
  test('Journey 2: Student Account Registration, Login & Event Seat Reservation', async () => {
    const registerRes = await request(app)
      .post('/api/student/register')
      .send({
        fullName: 'Alice E2E Student',
        rollNumber: 'CS2026111',
        email: 'alice.e2e@college.edu',
        department: 'Computer Science',
        year: '4th Year',
        password: 'password123',
      });

    expect(registerRes.status).toBe(201);
    studentToken = registerRes.body.token;
    studentId = registerRes.body._id;

    // Register for Event
    const regRes = await request(app)
      .post('/api/registrations')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ eventId });

    expect(regRes.status).toBe(201);
    expect(regRes.body.status).toBe('Registered');
    registrationId = regRes.body.id;

    // Verify Seat Decrement in DB
    const eventObj = await Event.findByPk(eventId);
    expect(eventObj.availableSeats).toBe(9);
  });

  // Journey 3: Student QR Entry Pass & Admin Attendance Scan
  test('Journey 3: Student Entry QR Pass Generation & Admin Scan Attendance', async () => {
    // Student gets QR Code
    const qrRes = await request(app)
      .get(`/api/qrcode/${registrationId}`)
      .set('Authorization', `Bearer ${studentToken}`);

    expect(qrRes.status).toBe(200);
    expect(qrRes.body.qrCodeUrl).toMatch(/^data:image/);

    // Admin scans QR code to mark attendance Present
    const scanRes = await request(app)
      .post('/api/qrcode/scan')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ registrationId });

    expect(scanRes.status).toBe(200);
    expect(scanRes.body.attendance.attendanceStatus).toBe('Present');

    // Verify PDF Certificate issued automatically
    const cert = await Certificate.findOne({ where: { registrationId } });
    expect(cert).not.toBeNull();
    certId = cert.id;
  });

  // Journey 4: Student Notification, Certificate Download & Profile Update
  test('Journey 4: Student Notification Center, PDF Certificate Download & Profile Edit', async () => {
    // Get Notifications
    const notifRes = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(notifRes.status).toBe(200);
    expect(notifRes.body.notifications.length).toBeGreaterThan(0);

    // Download PDF Certificate
    const certDownloadRes = await request(app)
      .get(`/api/certificates/${certId}/download`)
      .set('Authorization', `Bearer ${studentToken}`);

    expect(certDownloadRes.status).toBe(200);
    expect(certDownloadRes.headers['content-type']).toMatch(/application\/pdf/i);

    // Update Profile Avatar
    const profileRes = await request(app)
      .put('/api/profile')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        fullName: 'Alice E2E Updated',
        department: 'Artificial Intelligence',
      });

    expect(profileRes.status).toBe(200);
    expect(profileRes.body.fullName).toBe('Alice E2E Updated');
  });

  // Journey 5: Registration Cancellation & Seat Increment
  test('Journey 5: Registration Cancellation & Automatic Seat Increment', async () => {
    const cancelRes = await request(app)
      .delete(`/api/registrations/${registrationId}`)
      .set('Authorization', `Bearer ${studentToken}`);

    if (cancelRes.status !== 200) {
      console.log('Cancel Error Payload:', cancelRes.status, cancelRes.body);
    }
    expect(cancelRes.status).toBe(200);
    expect(cancelRes.body.message).toMatch(/cancelled/i);

    // Verify Seat Incremented back to 10 in DB
    const eventObj = await Event.findByPk(eventId);
    expect(eventObj.availableSeats).toBe(10);
  });

  // Journey 6: Admin Dashboard Metrics, Reports & CSV Exports
  test('Journey 6: Admin Dashboard Analytics, Occupancy Reports & CSV Exports', async () => {
    // 10 Cards Dashboard
    const dashRes = await request(app)
      .get('/api/admin/dashboard')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(dashRes.status).toBe(200);
    expect(dashRes.body).toHaveProperty('totalStudents');
    expect(dashRes.body).toHaveProperty('totalEvents');

    // Export CSVs
    const expEvents = await request(app)
      .get('/api/export/events')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(expEvents.status).toBe(200);
    expect(expEvents.headers['content-type']).toMatch(/text\/csv/i);

    const expPart = await request(app)
      .get('/api/export/participants')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(expPart.status).toBe(200);
    expect(expPart.headers['content-type']).toMatch(/text\/csv/i);

    // Audit Logs
    const auditRes = await request(app)
      .get('/api/auditlogs')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(auditRes.status).toBe(200);
    expect(auditRes.body.auditLogs.length).toBeGreaterThan(0);
  });

  // Journey 7: Security Guards & Role Protection
  test('Journey 7: Security Guards & Role Protection Enforcement', async () => {
    // Student attempting Admin Route (Forbidden 403)
    const unauthorizedRes = await request(app)
      .get('/api/admin/dashboard')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(unauthorizedRes.status).toBe(403);
  });
});
