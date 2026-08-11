const request = require('supertest');
const { app } = require('../server');
const { sequelize, Student, Admin, Event, Registration, Attendance, Certificate, Volunteer, VolunteerTask, Leaderboard } = require('../models');
const jwt = require('jsonwebtoken');

describe('Unified AI Assistant API Endpoint Test Suite (/api/ai/assistant)', () => {
  let studentToken, studentId;
  let adminToken, adminId;
  let testEventTomorrow, testEventPast;

  beforeAll(async () => {
    await sequelize.sync({ force: false });

    // Seed Badges catalog if needed
    const { seedBadges } = require('../services/GamificationService');
    await seedBadges();

    // 1. Test Student
    const [student] = await Student.findOrCreate({
      where: { email: 'unified_ai_student@college.edu' },
      defaults: {
        fullName: 'Unified AI Student',
        rollNumber: '2026UNI001',
        email: 'unified_ai_student@college.edu',
        password: 'password123',
        department: 'CSE',
        year: 3,
        section: 'A',
      },
    });
    studentId = student.id;
    studentToken = jwt.sign({ id: student.id, role: 'Student' }, process.env.JWT_SECRET || 'fallback_secret_for_dev_only', { expiresIn: '1h' });

    await Leaderboard.upsert({
      studentId: student.id,
      points: 300,
      eventsAttended: 1,
      volunteerHours: 2,
    });

    // 2. Test Admin
    const [admin] = await Admin.findOrCreate({
      where: { email: 'unified_ai_admin@college.edu' },
      defaults: {
        username: 'unified_admin',
        email: 'unified_ai_admin@college.edu',
        password: 'adminpassword123',
        role: 'Admin',
        isActive: true,
      },
    });
    adminId = admin.id;
    adminToken = jwt.sign({ id: admin.id, role: 'Admin' }, process.env.JWT_SECRET || 'fallback_secret_for_dev_only', { expiresIn: '1h' });

    // 3. Event Tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    testEventTomorrow = await Event.create({
      title: 'Unified AI Innovation Summit',
      description: 'Hands-on AI session for students.',
      category: 'Technical',
      eventDate: tomorrow,
      startTime: '10:00',
      endTime: '12:00',
      venue: 'Auditorium 2',
      organizer: 'CSE Dept',
      department: 'CSE',
      capacity: 50,
      availableSeats: 40,
      registrationDeadline: tomorrow,
      status: 'Upcoming',
      createdBy: admin.id,
    });

    // 4. Past Event with Registration and Volunteer
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 5);

    testEventPast = await Event.create({
      title: 'Unified Web Workshop',
      description: 'Full stack web session.',
      category: 'Technical',
      eventDate: pastDate,
      startTime: '09:00',
      endTime: '17:00',
      venue: 'Lab 3',
      organizer: 'CSE Dept',
      department: 'CSE',
      capacity: 100,
      availableSeats: 80,
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

    await Certificate.create({
      registrationId: reg.id,
      studentId: student.id,
      eventId: testEventPast.id,
      certificateId: 'CERT-UNIFIED-001',
      issueDate: pastDate,
      qrVerificationCode: 'UNIFIEDQR001',
    });

    const vol = await Volunteer.create({
      studentId: student.id,
      eventId: testEventPast.id,
      department: 'CSE',
      skills: 'coordination',
      status: 'approved',
      hours: 4,
    });

    await VolunteerTask.create({
      volunteerId: vol.id,
      eventId: testEventPast.id,
      title: 'Technical Usher',
      description: 'Assist speakers',
      status: 'completed',
    });
  });

  afterAll(async () => {
    await Certificate.destroy({ where: { studentId } });
    await Registration.destroy({ where: { studentId } });
    await VolunteerTask.destroy({ where: {} });
    await Volunteer.destroy({ where: { studentId } });
    if (testEventTomorrow) await testEventTomorrow.destroy();
    if (testEventPast) await testEventPast.destroy();
  });

  test('1. SEARCH EVENTS: Natural language search "technical workshops" returns matching events', async () => {
    const res = await request(app)
      .post('/api/ai/assistant')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ message: 'technical workshops', currentPage: 'AIAssistant' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('reply');
    expect(res.body).toHaveProperty('results');
    expect(res.body.targetType).toBe('events');
    expect(res.body.reply).toContain('Found');
    expect(Array.isArray(res.body.results)).toBe(true);
    expect(res.body.results.length).toBeGreaterThan(0);
  });

  test('2. SEARCH VOLUNTEERS: Natural language search "list volunteers" returns volunteer records', async () => {
    const res = await request(app)
      .post('/api/ai/assistant')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ message: 'list volunteers', currentPage: 'AIAssistant' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('reply');
    expect(res.body.targetType).toBe('volunteers');
    expect(Array.isArray(res.body.results)).toBe(true);
    expect(res.body.reply).toContain('volunteer record(s)');
  });

  test('3. SEARCH STUDENTS (Admin Role): Admin searching "show CSE students" gets student directory records', async () => {
    const res = await request(app)
      .post('/api/ai/assistant')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ message: 'show CSE students', currentPage: 'AIAssistant' });

    expect(res.status).toBe(200);
    expect(res.body.targetType).toBe('students');
    expect(Array.isArray(res.body.results)).toBe(true);
    expect(res.body.reply).toContain('Unified AI Student');
  });

  test('4. SEARCH STUDENTS (Student Role Protection): Student query for student directory returns permission error', async () => {
    const res = await request(app)
      .post('/api/ai/assistant')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ message: 'show CSE students', currentPage: 'AIAssistant' });

    expect(res.status).toBe(200);
    expect(res.body.reply).toContain('Student directory search requires Admin privileges.');
  });

  test('5. COPILOT QUERY: "How many XP do I have?" returns student XP & Silver level', async () => {
    const res = await request(app)
      .post('/api/ai/assistant')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ message: 'How many XP do I have?', currentPage: 'AIAssistant' });

    expect(res.status).toBe(200);
    expect(res.body.reply).toContain('300 XP');
    expect(res.body.reply).toContain('Silver');
  });

  test('6. COPILOT QUERY: "What events are tomorrow?" returns tomorrow event details', async () => {
    const res = await request(app)
      .post('/api/ai/assistant')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ message: 'What events are tomorrow?', currentPage: 'AIAssistant' });

    expect(res.status).toBe(200);
    expect(res.body.reply).toContain('Unified AI Innovation Summit');
  });

  test('7. COPILOT ADMIN QUERY: "Show inactive students who have not registered for any events." formatted without emails', async () => {
    const res = await request(app)
      .post('/api/ai/assistant')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ message: 'Show inactive students who have not registered for any events.', currentPage: 'AIAssistant' });

    expect(res.status).toBe(200);
    expect(res.body.reply).toContain('Inactive Students');
    expect(res.body.reply).not.toContain('@college.edu');
  });

  test('8. COPILOT QUERY: "Show my certificates" returns certificate records', async () => {
    const res = await request(app)
      .post('/api/ai/assistant')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ message: 'Show my certificates', currentPage: 'AIAssistant' });

    expect(res.status).toBe(200);
    expect(res.body.reply).toContain('CERT-UNIFIED-001');
  });
});
