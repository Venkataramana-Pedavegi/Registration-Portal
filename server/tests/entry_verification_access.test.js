const request = require('supertest');
const { app } = require('../server');
const { sequelize, Student, Admin, Event, Registration, Volunteer } = require('../models');
const jwt = require('jsonwebtoken');

describe('Entry Verification Role & Access Authorization Test Suite', () => {
  let adminToken, adminId;
  let regularStudentToken, regularStudentId;
  let approvedVolunteerToken, approvedVolunteerStudentId;
  let testEvent, testRegistration, volRecord;

  beforeAll(async () => {
    await sequelize.sync({ force: false });

    // 1. Admin account
    let admin = await Admin.findOne({ where: { email: 'entry_admin_test@college.edu' } });
    if (!admin) {
      admin = await Admin.create({
        username: 'entry_admin_test',
        email: 'entry_admin_test@college.edu',
        password: 'adminpassword123',
        role: 'Admin',
        isActive: true,
      });
    }
    adminId = admin.id;
    adminToken = jwt.sign({ id: admin.id, role: 'Admin' }, process.env.JWT_SECRET || 'fallback_secret_for_dev_only', { expiresIn: '1h' });

    // 2. Regular Student account (NOT an approved volunteer)
    let student = await Student.findOne({ where: { email: 'regular_student_test@college.edu' } });
    if (!student) {
      student = await Student.create({
        fullName: 'Regular Student Test',
        rollNumber: '2026REG999',
        email: 'regular_student_test@college.edu',
        password: 'password123',
        department: 'CSE',
        year: 3,
      });
    }
    regularStudentId = student.id;
    regularStudentToken = jwt.sign({ id: student.id, role: 'Student' }, process.env.JWT_SECRET || 'fallback_secret_for_dev_only', { expiresIn: '1h' });

    // 3. Approved Volunteer Student account
    let volStudent = await Student.findOne({ where: { email: 'approved_volunteer_test@college.edu' } });
    if (!volStudent) {
      volStudent = await Student.create({
        fullName: 'Approved Volunteer Student Test',
        rollNumber: '2026VOL999',
        email: 'approved_volunteer_test@college.edu',
        password: 'password123',
        department: 'ECE',
        year: 4,
      });
    }
    approvedVolunteerStudentId = volStudent.id;
    approvedVolunteerToken = jwt.sign({ id: volStudent.id, role: 'Student' }, process.env.JWT_SECRET || 'fallback_secret_for_dev_only', { expiresIn: '1h' });

    // Create Event
    const eventDate = new Date();
    eventDate.setDate(eventDate.getDate() + 2);
    testEvent = await Event.create({
      title: 'Gate Verification Tech Fest Test',
      description: 'Campus festival entry testing.',
      category: 'Technical',
      eventDate,
      startTime: '09:00',
      endTime: '17:00',
      venue: 'Main Gate Assembly',
      organizer: 'ECE Dept',
      department: 'ECE',
      capacity: 200,
      availableSeats: 190,
      registrationDeadline: eventDate,
      status: 'Upcoming',
      createdBy: admin.id,
    });

    // Create Registration for regular student
    testRegistration = await Registration.create({
      studentId: regularStudentId,
      eventId: testEvent.id,
      registrationDate: new Date(),
      status: 'Registered',
    });

    // Create Approved Volunteer Record for volStudent
    volRecord = await Volunteer.create({
      studentId: approvedVolunteerStudentId,
      eventId: testEvent.id,
      department: 'ECE',
      skills: 'Gate Verification',
      status: 'approved',
      hours: 5,
    });
  });

  afterAll(async () => {
    if (volRecord) await volRecord.destroy().catch(() => {});
    if (testRegistration) await testRegistration.destroy().catch(() => {});
    if (testEvent) await testEvent.destroy().catch(() => {});
    if (regularStudentId) await Student.destroy({ where: { id: regularStudentId } }).catch(() => {});
    if (approvedVolunteerStudentId) await Student.destroy({ where: { id: approvedVolunteerStudentId } }).catch(() => {});
  });

  test('1. Admin can successfully verify event entry (POST /api/admin/entry/verify)', async () => {
    const res = await request(app)
      .post('/api/admin/entry/verify')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ registrationId: testRegistration.id });

    expect(res.status).toBe(200);
    expect(res.body.valid).toBe(true);
    expect(res.body.student.name).toBe('Regular Student Test');
  });

  test('2. Admin can successfully verify pass details (GET /api/qrcode/verify/:registrationId)', async () => {
    const res = await request(app)
      .get(`/api/qrcode/verify/${testRegistration.id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.isValid).toBe(true);
    expect(res.body.studentName).toBe('Regular Student Test');
  });

  test('3. Approved Volunteer can successfully verify event entry (POST /api/admin/entry/verify)', async () => {
    const res = await request(app)
      .post('/api/admin/entry/verify')
      .set('Authorization', `Bearer ${approvedVolunteerToken}`)
      .send({ registrationId: testRegistration.id });

    expect(res.status).toBe(200);
    expect(res.body.valid).toBe(true);
    expect(res.body.student.name).toBe('Regular Student Test');
  });

  test('4. Approved Volunteer can successfully verify pass details (GET /api/qrcode/verify/:registrationId)', async () => {
    const res = await request(app)
      .get(`/api/qrcode/verify/${testRegistration.id}`)
      .set('Authorization', `Bearer ${approvedVolunteerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.isValid).toBe(true);
    expect(res.body.studentName).toBe('Regular Student Test');
  });

  test('5. Student (non-approved volunteer) CANNOT call POST /api/admin/entry/verify (HTTP 403)', async () => {
    const res = await request(app)
      .post('/api/admin/entry/verify')
      .set('Authorization', `Bearer ${regularStudentToken}`)
      .send({ registrationId: testRegistration.id });

    expect(res.status).toBe(403);
    expect(res.body.message).toContain('Access denied');
  });

  test('6. Student (non-approved volunteer) CANNOT call GET /api/qrcode/verify/:registrationId (HTTP 403)', async () => {
    const res = await request(app)
      .get(`/api/qrcode/verify/${testRegistration.id}`)
      .set('Authorization', `Bearer ${regularStudentToken}`);

    expect(res.status).toBe(403);
    expect(res.body.message).toContain('Access denied');
  });

  test('7. Student CAN still view/download their OWN Event Entry QR Pass (GET /api/qrcode/:registrationId)', async () => {
    const res = await request(app)
      .get(`/api/qrcode/${testRegistration.id}`)
      .set('Authorization', `Bearer ${regularStudentToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('qrCodeUrl');
    expect(res.body.studentName).toBe('Regular Student Test');
  });

  test('8. Approved Volunteer MUST NOT have access to full Admin routes (HTTP 403 on /api/admin/admins)', async () => {
    const res = await request(app)
      .get('/api/admin/admins')
      .set('Authorization', `Bearer ${approvedVolunteerToken}`);

    expect(res.status).toBe(403);
    expect(res.body.message).toContain('Access denied');
  });

  test('9. Attendance remains MANUAL (POST /api/qrcode/scan returns HTTP 400 disabled message)', async () => {
    const res = await request(app)
      .post('/api/qrcode/scan')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ registrationId: testRegistration.id });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('QR scanning for attendance is disabled');
  });
});
