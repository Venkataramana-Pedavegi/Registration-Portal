const request = require('supertest');
const { app } = require('../server');
const { sequelize, Admin, Event, Student, Volunteer } = require('../models');
const jwt = require('jsonwebtoken');

describe('Admin Hub AI Features Endpoints Test Suite', () => {
  let adminToken, adminId;
  let testEvent, testStudent, testVolunteer;

  beforeAll(async () => {
    await sequelize.sync({ force: false });

    // 1. Create active admin
    const [admin] = await Admin.findOrCreate({
      where: { email: 'ai_hub_admin@college.edu' },
      defaults: {
        username: 'ai_hub_admin',
        email: 'ai_hub_admin@college.edu',
        password: 'adminpassword123',
        role: 'Admin',
        isActive: true,
      },
    });
    adminId = admin.id;
    adminToken = jwt.sign({ id: admin.id, role: 'Admin' }, process.env.JWT_SECRET || 'secret', { expiresIn: '1h' });

    // 2. Create test technical workshop event
    testEvent = await Event.create({
      title: 'Advanced AI & Machine Learning Workshop',
      description: 'Hands-on technical workshop on deep learning and neural networks.',
      category: 'Technical',
      eventDate: new Date(),
      startTime: '10:00',
      endTime: '16:00',
      venue: 'Seminar Hall B',
      organizer: 'CSE Department',
      department: 'CSE',
      capacity: 100,
      availableSeats: 80,
      registrationDeadline: new Date(),
      status: 'Upcoming',
      createdBy: admin.id,
    });

    // 3. Create test student
    [testStudent] = await Student.findOrCreate({
      where: { email: 'volunteer_test_student@college.edu' },
      defaults: {
        fullName: 'Chinni Volunteer Student',
        rollNumber: '2026VOL001',
        email: 'volunteer_test_student@college.edu',
        password: 'password123',
        department: 'CS',
        year: 3,
        section: 'A',
      },
    });

    // 4. Create test volunteer application
    testVolunteer = await Volunteer.create({
      studentId: testStudent.id,
      eventId: testEvent.id,
      department: 'CS',
      skills: 'media',
      status: 'approved',
    });
  });

  afterAll(async () => {
    if (testVolunteer) await testVolunteer.destroy();
    if (testEvent) await testEvent.destroy();
  });

  const eventQueries = [
    'technical',
    'workshop',
    'workshops',
    'technical workshop',
    'technical workshops',
    'technical events',
    'show technical workshops',
    'list technical workshops',
    'events for CSE',
    'upcoming technical events',
    'TECHNICAL WORKSHOPS',
    '  technical   workshops  '
  ];

  eventQueries.forEach((q) => {
    test(`Smart Search (AI) returns event results for query: "${q}"`, async () => {
      const res = await request(app)
        .get(`/api/ai/smart-search?query=${encodeURIComponent(q)}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('type', 'events');
      expect(res.body).toHaveProperty('results');
      expect(Array.isArray(res.body.results)).toBe(true);
      expect(res.body.results.length).toBeGreaterThan(0);
      expect(res.body.results.some((ev) => ev.id === testEvent.id)).toBe(true);
    });
  });

  const volunteerQueries = [
    'list volunteers',
    'volunteers',
    'show volunteers',
    'find volunteers',
    'approved volunteers',
    'list approved volunteers',
    'CS volunteers',
  ];

  volunteerQueries.forEach((q) => {
    test(`Smart Search (AI) returns volunteer results for query: "${q}"`, async () => {
      const res = await request(app)
        .get(`/api/ai/smart-search?query=${encodeURIComponent(q)}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('type', 'volunteers');
      expect(res.body).toHaveProperty('results');
      expect(Array.isArray(res.body.results)).toBe(true);
      expect(res.body.results.length).toBeGreaterThan(0);
    });
  });

  test('Smart Search (AI) handles empty query with 400', async () => {
    const res = await request(app)
      .get('/api/ai/smart-search?query=')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(400);
  });

  test('Smart Search (AI) handles non-matching random query gracefully', async () => {
    const res = await request(app)
      .get('/api/ai/smart-search?query=xyznonexistentquery999')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('results');
    expect(res.body.results.length).toBe(0);
  });

  test('Copilot Assistant (AI) endpoint returns chat response for Admin', async () => {
    const res = await request(app)
      .post('/api/ai/chat')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ message: 'List all upcoming events', currentPage: 'AIAssistant' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('reply');
    expect(typeof res.body.reply).toBe('string');
  });

  test('Feedback Analysis (AI) endpoint returns analysis results for Admin', async () => {
    const res = await request(app)
      .get(`/api/ai/feedback-analysis/${testEvent.id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('overallSentiment');
  });
});
