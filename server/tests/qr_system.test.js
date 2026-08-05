const request = require('supertest');
const { app } = require('../server');
const { sequelize, Student, Event, Registration, Attendance, Certificate } = require('../models');
const jwt = require('jsonwebtoken');

describe('Full End-to-End QR Code System Test Suite', () => {
  let studentToken, adminToken, studentId, eventId, registrationId, qrPayloadString;

  beforeAll(async () => {
    await sequelize.sync({ force: false });

    // Create test student
    const [student] = await Student.findOrCreate({
      where: { email: 'qrstudent@college.edu' },
      defaults: {
        fullName: 'QR Test Student',
        rollNumber: 'QR2026001',
        email: 'qrstudent@college.edu',
        password: 'password123',
        department: 'CSE',
        year: '3rd Year',
        section: 'A',
      },
    });
    studentId = student.id;
    studentToken = jwt.sign({ id: student.id, role: 'Student' }, process.env.JWT_SECRET || 'secret', { expiresIn: '1h' });
    adminToken = jwt.sign({ id: 1, role: 'Admin' }, process.env.JWT_SECRET || 'secret', { expiresIn: '1h' });

    // Create test event with valid fields
    const event = await Event.create({
      title: 'QR Code Tech Symposium 2026',
      description: 'Full E2E QR test event',
      category: 'Technical',
      eventDate: new Date(Date.now() + 86400000),
      startTime: '10:00 AM',
      endTime: '04:00 PM',
      venue: 'Main Auditorium',
      organizer: 'CSE Dept',
      capacity: 50,
      availableSeats: 50,
      registrationDeadline: new Date(Date.now() + 43200000),
      status: 'Upcoming',
      createdBy: 1,
    });
    eventId = event.id;
  });

  test('1. Registration → Automatic QR Code Generation & Storage', async () => {
    const res = await request(app)
      .post('/api/registrations')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ eventId });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('id');
    registrationId = res.body.id;

    // Verify QR code is stored in DB
    const regInDb = await Registration.findByPk(registrationId);
    expect(regInDb.qrCodeUrl).toBeTruthy();
    expect(regInDb.qrCodeUrl).toContain('data:image/png;base64');
  });

  test('2. QR Display Retrieval → GET /api/qrcode/:registrationId', async () => {
    const res = await request(app)
      .get(`/api/qrcode/${registrationId}`)
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.registrationId).toBe(registrationId);
    expect(res.body.qrCodeUrl).toBeTruthy();
    expect(res.body.eventTitle).toBe('QR Code Tech Symposium 2026');

    // Create valid payload string for scanner test
    qrPayloadString = JSON.stringify({
      registrationId,
      eventId,
      studentId,
      rollNumber: 'QR2026001',
    });
  });

  test('3. Admin QR Scan → Attendance Marked Present & Certificate Issued', async () => {
    const res = await request(app)
      .post('/api/qrcode/scan')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ qrData: qrPayloadString });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toContain('Attendance marked Present');

    // Verify Attendance DB Record
    const attendance = await Attendance.findOne({ where: { registrationId } });
    expect(attendance).toBeTruthy();
    expect(attendance.attendanceStatus).toBe('Present');

    // Verify Certificate Issued
    const cert = await Certificate.findOne({ where: { registrationId } });
    expect(cert).toBeTruthy();
    expect(cert.certificateId).toContain('CERT-2026-');
  });

  test('4. Reject Duplicate QR Scan', async () => {
    const res = await request(app)
      .post('/api/qrcode/scan')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ qrData: qrPayloadString });

    expect(res.statusCode).toBe(400);
    expect(res.body.alreadyScanned).toBe(true);
    expect(res.body.message).toContain('Attendance already marked Present');
  });
});
