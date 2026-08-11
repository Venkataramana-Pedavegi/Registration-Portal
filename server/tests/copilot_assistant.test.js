const request = require('supertest');
const { app } = require('../server');
const { sequelize, Student, Admin, Event, Registration, Attendance, Certificate, Volunteer, VolunteerTask, Leaderboard, Badge } = require('../models');
const jwt = require('jsonwebtoken');

describe('AI Copilot Assistant Endpoints Test Suite (10 Required Scenarios)', () => {
  let studentToken, studentId;
  let adminToken, adminId;
  let testEventTomorrow, testEventPast;

  beforeAll(async () => {
    await sequelize.sync({ force: false });

    // Seed Badges catalog if empty
    const { seedBadges } = require('../services/GamificationService');
    await seedBadges();

    // 1. Create active test student
    const [student] = await Student.findOrCreate({
      where: { email: 'copilot_student_test@college.edu' },
      defaults: {
        fullName: 'Copilot Test Student',
        rollNumber: '2026COP001',
        email: 'copilot_student_test@college.edu',
        password: 'password123',
        department: 'CSE',
        year: 3,
        section: 'A',
      },
    });
    studentId = student.id;
    studentToken = jwt.sign({ id: student.id, role: 'Student' }, process.env.JWT_SECRET || 'fallback_secret_for_dev_only', { expiresIn: '1h' });

    // Seed Leaderboard entry for student with 190 XP
    await Leaderboard.upsert({
      studentId: student.id,
      points: 190,
      eventsAttended: 1,
      volunteerHours: 0,
    });

    // 2. Create active test admin
    const [admin] = await Admin.findOrCreate({
      where: { email: 'copilot_admin_test@college.edu' },
      defaults: {
        username: 'copilot_admin',
        email: 'copilot_admin_test@college.edu',
        password: 'adminpassword123',
        role: 'Admin',
        isActive: true,
      },
    });
    adminId = admin.id;
    adminToken = jwt.sign({ id: admin.id, role: 'Admin' }, process.env.JWT_SECRET || 'fallback_secret_for_dev_only', { expiresIn: '1h' });

    // 3. Create Event tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    testEventTomorrow = await Event.create({
      title: 'AI Copilot Innovation Workshop',
      description: 'Hands-on workshop on AI Copilots.',
      category: 'Technical',
      eventDate: tomorrow,
      startTime: '10:00',
      endTime: '12:00',
      venue: 'Auditorium 1',
      organizer: 'CSE Dept',
      department: 'CSE',
      capacity: 50,
      availableSeats: 45,
      registrationDeadline: tomorrow,
      status: 'Upcoming',
      createdBy: admin.id,
    });

    // 4. Create past Event with registration, attendance, and certificate
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 10);

    testEventPast = await Event.create({
      title: 'Web Engineering Bootcamp',
      description: 'Web development session.',
      category: 'Technical',
      eventDate: pastDate,
      startTime: '09:00',
      endTime: '17:00',
      venue: 'Main Lab',
      organizer: 'CSE Dept',
      department: 'CSE',
      capacity: 100,
      availableSeats: 90,
      registrationDeadline: pastDate,
      status: 'Completed',
      createdBy: admin.id,
    });

    const reg = await Registration.create({
      studentId: student.id,
      eventId: testEventPast.id,
      registrationDate: pastDate,
      status: 'Registered',
    });

    await Attendance.create({
      registrationId: reg.id,
      eventId: testEventPast.id,
      studentId: student.id,
      attendanceStatus: 'Present',
      markedAt: pastDate,
    });

    await Certificate.create({
      registrationId: reg.id,
      studentId: student.id,
      eventId: testEventPast.id,
      certificateId: 'CERT-COPILOT-001',
      issueDate: pastDate,
      qrVerificationCode: 'QRVERIFY001',
    });

    const vol = await Volunteer.create({
      studentId: student.id,
      eventId: testEventPast.id,
      department: 'CSE',
      skills: 'coordination',
      status: 'approved',
      hours: 5,
    });

    await VolunteerTask.create({
      volunteerId: vol.id,
      eventId: testEventPast.id,
      title: 'Hall Usher',
      description: 'Guide participants',
      status: 'completed',
    });
  });

  afterAll(async () => {
    await Certificate.destroy({ where: { studentId } });
    await Attendance.destroy({ where: { studentId } });
    await Registration.destroy({ where: { studentId } });
    await VolunteerTask.destroy({ where: {} });
    await Volunteer.destroy({ where: { studentId } });
    if (testEventTomorrow) await testEventTomorrow.destroy();
    if (testEventPast) await testEventPast.destroy();
  });

  test('TEST 1: "What badge can I unlock next?" returns real badge/achievement data', async () => {
    const res = await request(app)
      .post('/api/ai/chat')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ message: 'What badge can I unlock next?', currentPage: 'AIAssistant' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('reply');
    expect(res.body.reply).toContain('190 XP');
    expect(res.body.reply).toContain('Bronze badge');
    expect(res.body.reply).toContain('Silver');
  });

  test('TEST 2: "Show my certificates" returns actual certificate details', async () => {
    const res = await request(app)
      .post('/api/ai/chat')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ message: 'Show my certificates', currentPage: 'AIAssistant' });

    expect(res.status).toBe(200);
    expect(res.body.reply).toContain('1 certificate(s)');
    expect(res.body.reply).toContain('CERT-COPILOT-001');
  });

  test('TEST 3: "What events are tomorrow?" returns actual events scheduled for tomorrow', async () => {
    const res = await request(app)
      .post('/api/ai/chat')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ message: 'What events are tomorrow?', currentPage: 'AIAssistant' });

    expect(res.status).toBe(200);
    expect(res.body.reply).toContain('AI Copilot Innovation Workshop');
    expect(res.body.reply).toContain('Auditorium 1');
  });

  test('TEST 4: "How many events did I attend?" returns actual attendance data', async () => {
    const res = await request(app)
      .post('/api/ai/chat')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ message: 'How many events did I attend?', currentPage: 'AIAssistant' });

    expect(res.status).toBe(200);
    expect(res.body.reply).toContain('attended 1 event(s)');
    expect(res.body.reply).toContain('Web Engineering Bootcamp');
  });

  test('TEST 5: "Show my volunteer tasks" returns actual volunteer and task records', async () => {
    const res = await request(app)
      .post('/api/ai/chat')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ message: 'Show my volunteer tasks', currentPage: 'AIAssistant' });

    expect(res.status).toBe(200);
    expect(res.body.reply).toContain('Hall Usher');
    expect(res.body.reply).toContain('approved');
  });

  test('TEST 6: "How many XP do I have?" returns actual XP and level', async () => {
    const res = await request(app)
      .post('/api/ai/chat')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ message: 'How many XP do I have?', currentPage: 'AIAssistant' });

    expect(res.status).toBe(200);
    expect(res.body.reply).toContain('190 XP');
    expect(res.body.reply).toContain('Bronze');
  });

  test('TEST 7: "What should I attend?" returns relevant recommendations', async () => {
    const res = await request(app)
      .post('/api/ai/chat')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ message: 'What should I attend?', currentPage: 'AIAssistant' });

    expect(res.status).toBe(200);
    expect(res.body.reply).toContain('Recommended for CSE students');
  });

  test('TEST 8: Invalid/unsupported question returns helpful fallback message', async () => {
    const res = await request(app)
      .post('/api/ai/chat')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ message: 'What is quantum electrodynamics in vacuum?', currentPage: 'AIAssistant' });

    expect(res.status).toBe(200);
    expect(res.body.reply).toContain('I can help with events, registrations, certificates, achievements, badges, attendance, volunteering');
  });

  test('TEST 9: Unauthenticated request returns 401 status', async () => {
    const res = await request(app)
      .post('/api/ai/chat')
      .send({ message: 'What badge can I unlock next?' });

    expect(res.status).toBe(401);
  });

  test('TEST 10: Admin query returns admin functionality output', async () => {
    const res = await request(app)
      .post('/api/ai/chat')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ message: 'Show attendance summary rates of completed events.', currentPage: 'AIAssistant' });

    expect(res.status).toBe(200);
    expect(res.body.reply).toContain('Attendance Summary Report:');
  });

  test('TEST 11: Admin query "Show inactive students who have not registered for any events." executes real database query', async () => {
    // Create an inactive student with no registrations
    const inactiveStud = await Student.create({
      fullName: 'Zero Registration Student',
      rollNumber: '2026INACTIVE01',
      email: 'inactive_test_student@college.edu',
      password: 'password123',
      department: 'ECE',
      year: 2,
      isActive: true
    });

    const res = await request(app)
      .post('/api/ai/chat')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ message: 'Show inactive students who have not registered for any events.', currentPage: 'AIAssistant' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('reply');
    expect(res.body.reply).toContain('Inactive Students');
    expect(res.body.reply).toContain('Zero Registration Student');
    expect(res.body.reply).toContain('2026INACTIVE01');
    expect(res.body.reply).toContain('Department: ECE');
    expect(res.body.reply).not.toContain('@college.edu');
    expect(res.body.reply).not.toContain('inactive_test_student@college.edu');

    await inactiveStud.destroy();
  });
});
