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

  test('3. Admin Mark Attendance → Attendance Marked Present & Certificate Issued', async () => {
    const res = await request(app)
      .post('/api/attendance')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ registrationId, attendanceStatus: 'Present' });

    expect(res.statusCode).toBe(201);
    expect(res.body.attendanceStatus).toBe('Present');

    // Verify Attendance DB Record
    const attendance = await Attendance.findOne({ where: { registrationId } });
    expect(attendance).toBeTruthy();
    expect(attendance.attendanceStatus).toBe('Present');

    // Verify Certificate Issued
    const cert = await Certificate.findOne({ where: { registrationId } });
    expect(cert).toBeTruthy();
    expect(cert.certificateId).toContain('CERT-2026-');
  });

  test('4. Reject Duplicate Attendance Mark', async () => {
    const res = await request(app)
      .post('/api/attendance')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ registrationId, attendanceStatus: 'Present' });

    expect(res.statusCode).toBe(400);
    expect(res.body.alreadyScanned).toBe(true);
    expect(res.body.message).toContain('Attendance already marked Present');
  });

  test('5. Verify QR Scan Endpoint is Disabled', async () => {
    const res = await request(app)
      .post('/api/qrcode/scan')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ registrationId });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toContain('QR scanning for attendance is disabled');
  });

  test('6. POST /api/admin/entry/verify - Verify valid event entry', async () => {
    const [anotherStudent] = await Student.findOrCreate({
      where: { email: 'entryverify@college.edu' },
      defaults: {
        fullName: 'Entry Test Student',
        rollNumber: 'EN2026001',
        email: 'entryverify@college.edu',
        password: 'password123',
        department: 'CSE',
        year: '3rd Year',
        section: 'A',
      },
    });

    const studentToken = jwt.sign({ id: anotherStudent.id, role: 'Student' }, process.env.JWT_SECRET || 'secret');

    const regRes = await request(app)
      .post('/api/registrations')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ eventId });

    const newRegId = regRes.body.id;

    const res = await request(app)
      .post('/api/admin/entry/verify')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ registrationId: newRegId });

    expect(res.statusCode).toBe(200);
    expect(res.body.valid).toBe(true);
    expect(res.body.student.name).toBe('Entry Test Student');
    expect(res.body.student.rollNumber).toBe('EN2026001');
    expect(res.body.event.name).toBe('QR Code Tech Symposium 2026');
    expect(res.body.registration.id).toBe(newRegId);
    expect(res.body.registration.status).toBe('Registered');

    // Confirm that verifying the entry does NOT mark the student Present in Attendances
    const attendance = await Attendance.findOne({ where: { registrationId: newRegId } });
    expect(attendance).toBeNull();
  });

  test('7. POST /api/admin/entry/verify - Reject invalid registration', async () => {
    const res = await request(app)
      .post('/api/admin/entry/verify')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ registrationId: 99999 });

    expect(res.statusCode).toBe(404);
    expect(res.body.message).toContain('Registration not found');
  });

  test('8. POST /api/admin/entry/verify - Reject cancelled registration', async () => {
    const [cancelledStudent] = await Student.findOrCreate({
      where: { email: 'cancelled@college.edu' },
      defaults: {
        fullName: 'Cancelled Student',
        rollNumber: 'CN2026001',
        email: 'cancelled@college.edu',
        password: 'password123',
        department: 'CSE',
        year: '3rd Year',
        section: 'A',
      },
    });

    const studentToken = jwt.sign({ id: cancelledStudent.id, role: 'Student' }, process.env.JWT_SECRET || 'secret');
    const regRes = await request(app)
      .post('/api/registrations')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ eventId });

    const newRegId = regRes.body.id;

    // Cancel registration
    await request(app)
      .delete(`/api/registrations/${newRegId}`)
      .set('Authorization', `Bearer ${studentToken}`);

    const res = await request(app)
      .post('/api/admin/entry/verify')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ registrationId: newRegId });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toContain('Registration has been cancelled');
  });
});
