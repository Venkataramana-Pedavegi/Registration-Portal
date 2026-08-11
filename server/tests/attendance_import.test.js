const request = require('supertest');
const { app } = require('../server');
const { sequelize, Admin, Student, Event, Registration, Attendance } = require('../models');
const jwt = require('jsonwebtoken');

describe('Admin-Only Attendance Import API (/api/attendance/import)', () => {
  let adminToken;
  let coordinatorToken;
  let studentToken;
  let testEvent;
  let student1, student2;
  let reg1, reg2;

  beforeAll(async () => {
    await sequelize.sync({ force: false });

    // Create Admin
    const [admin] = await Admin.findOrCreate({
      where: { email: 'admin_import_test@college.edu' },
      defaults: {
        username: 'admin_import_test',
        password: 'Password123!',
        role: 'Admin',
        department: 'CSE',
        permissions: JSON.stringify(['Attendance', 'Events']),
        isActive: true,
      },
    });

    adminToken = jwt.sign(
      { id: admin.id, role: 'Admin' },
      process.env.JWT_SECRET || 'fallback_secret_for_dev_only',
      { expiresIn: '1h' }
    );

    // Create Coordinator (Non-Admin for attendance import)
    const [coord] = await Admin.findOrCreate({
      where: { email: 'coordinator_import_test@college.edu' },
      defaults: {
        username: 'coordinator_import_test',
        password: 'Password123!',
        role: 'Event Coordinator',
        department: 'CSE',
        permissions: JSON.stringify(['Events']),
        isActive: true,
      },
    });

    coordinatorToken = jwt.sign(
      { id: coord.id, role: 'Event Coordinator' },
      process.env.JWT_SECRET || 'fallback_secret_for_dev_only',
      { expiresIn: '1h' }
    );

    // Create Student
    const [stud1] = await Student.findOrCreate({
      where: { email: 'student_import_1@college.edu' },
      defaults: {
        fullName: 'Import Student One',
        rollNumber: '21IMP001',
        password: 'Password123!',
        department: 'CSE',
        year: '3rd Year',
        isVerified: true,
      },
    });
    student1 = stud1;

    const [stud2] = await Student.findOrCreate({
      where: { email: 'student_import_2@college.edu' },
      defaults: {
        fullName: 'Import Student Two',
        rollNumber: '21IMP002',
        password: 'Password123!',
        department: 'ECE',
        year: '3rd Year',
        isVerified: true,
      },
    });
    student2 = stud2;

    studentToken = jwt.sign(
      { id: student1.id, role: 'Student' },
      process.env.JWT_SECRET || 'fallback_secret_for_dev_only',
      { expiresIn: '1h' }
    );

    // Create Event
    const [ev] = await Event.findOrCreate({
      where: { title: 'Attendance Import Hackathon Test' },
      defaults: {
        description: 'Test event for attendance import feature',
        category: 'Technical',
        venue: 'Main Auditorium',
        eventDate: new Date(),
        startTime: '09:00',
        endTime: '17:00',
        registrationDeadline: new Date(),
        organizer: 'CSE Dept',
        capacity: 100,
        availableSeats: 98,
        status: 'Upcoming',
        createdBy: admin.id,
      },
    });
    testEvent = ev;

    // Registrations
    const [r1] = await Registration.findOrCreate({
      where: { studentId: student1.id, eventId: testEvent.id },
      defaults: {
        studentId: student1.id,
        eventId: testEvent.id,
        status: 'Registered',
        registrationDate: new Date(),
      },
    });
    reg1 = r1;

    const [r2] = await Registration.findOrCreate({
      where: { studentId: student2.id, eventId: testEvent.id },
      defaults: {
        studentId: student2.id,
        eventId: testEvent.id,
        status: 'Registered',
        registrationDate: new Date(),
      },
    });
    reg2 = r2;
  });

  test('POST /api/attendance/import - Deny access to Coordinator (HTTP 403)', async () => {
    const res = await request(app)
      .post('/api/attendance/import')
      .set('Authorization', `Bearer ${coordinatorToken}`)
      .send({
        eventId: testEvent.id,
        records: [{ registrationId: reg1.id, attendanceStatus: 'Present' }],
      });

    expect(res.statusCode).toBe(403);
    expect(res.body.message).toMatch(/Admins only/i);
  });

  test('POST /api/attendance/import - Deny access to Student (HTTP 403)', async () => {
    const res = await request(app)
      .post('/api/attendance/import')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        eventId: testEvent.id,
        records: [{ registrationId: reg1.id, attendanceStatus: 'Present' }],
      });

    expect(res.statusCode).toBe(403);
    expect(res.body.message).toMatch(/Admins only/i);
  });

  test('POST /api/attendance/import - Admin preview dryRun validation', async () => {
    const res = await request(app)
      .post('/api/attendance/import')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        eventId: testEvent.id,
        dryRun: true,
        records: [
          { registrationId: reg1.id, attendanceStatus: 'Present' },
          { rollNumber: '21IMP002', attendanceStatus: 'Absent' },
          { rollNumber: 'INVALID_ROLL_999', attendanceStatus: 'Present' },
        ],
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.summary.totalProcessed).toBe(3);
    expect(res.body.summary.validCount).toBe(2);
    expect(res.body.summary.invalidCount).toBe(1);
    expect(res.body.errorRecords[0].reason).toMatch(/Registration record not found/i);
  });

  test('POST /api/attendance/import - Admin bulk import success', async () => {
    const res = await request(app)
      .post('/api/attendance/import')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        eventId: testEvent.id,
        records: [
          { registrationId: reg1.id, attendanceStatus: 'Present' },
          { rollNumber: '21IMP002', attendanceStatus: 'Absent' },
        ],
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.summary.imported).toBe(2);

    // Verify DB records
    const att1 = await Attendance.findOne({ where: { registrationId: reg1.id } });
    expect(att1).not.toBeNull();
    expect(att1.attendanceStatus).toBe('Present');

    const att2 = await Attendance.findOne({ where: { registrationId: reg2.id } });
    expect(att2).not.toBeNull();
    expect(att2.attendanceStatus).toBe('Absent');
  });

  test('POST /api/attendance/import - Prevent duplicate Present attendance import', async () => {
    const res = await request(app)
      .post('/api/attendance/import')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        eventId: testEvent.id,
        records: [
          { registrationId: reg1.id, attendanceStatus: 'Present' },
        ],
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.summary.imported).toBe(0);
    expect(res.body.summary.skipped).toBe(1);
    expect(res.body.summary.errorRecords[0].reason).toMatch(/Duplicate: Attendance already marked Present/i);
  });
});
