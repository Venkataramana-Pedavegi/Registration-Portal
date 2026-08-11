const request = require('supertest');
const { sequelize, Admin } = require('../models');

const initDb = require('../utils/initDb');

let app;
let server;

beforeAll(async () => {
  process.env.JWT_SECRET = 'event_test_secret_key';
  
  // Create DB if not exists
  await initDb();
  
  // Recreate all tables fresh in the test database
  await sequelize.sync({ force: true });
  
  // Manual seed of default admin for testing (since sync dropped tables)
  await Admin.create({
    username: 'admin',
    email: 'admin@college.edu',
    password: 'adminpassword',
    role: 'Admin',
  });

  // Import app and server
  const backend = require('../server');
  app = backend.app;
  server = backend.server;
  
  // Wait a small bit to ensure DB connect & seeding completes
  await new Promise((resolve) => setTimeout(resolve, 500));
});

afterAll(async () => {
  // Close database connections and server
  await sequelize.close();
  await new Promise((resolve) => server.close(resolve));
});

describe('College Event Registration Event CRUD APIs', () => {
  let adminToken;
  let studentToken;
  let eventId;

  // Set up student and admin users and generate tokens before running tests
  beforeAll(async () => {
    // 1. Get seeded Admin token
    const adminRes = await request(app)
      .post('/api/admin/login')
      .send({
        email: 'admin@college.edu',
        password: 'adminpassword',
      });
    adminToken = adminRes.body.token;

    // 2. Register a Student and get token
    const studentRes = await request(app)
      .post('/api/student/register')
      .send({
        fullName: 'Alex Smith',
        rollNumber: 'CS202688',
        email: 'alexsmith@college.edu',
        department: 'Information Technology',
        year: '2nd Year',
        password: 'studentpassword123',
      });
    studentToken = studentRes.body.token;
  });

  const validEventData = {
    title: 'Hackathon 2026',
    description: 'A 24-hour programming challenge.',
    category: 'Technical',
    venue: 'Main Seminar Hall',
    eventDate: '2026-10-15',
    startTime: '09:00',
    endTime: '17:00',
    registrationDeadline: '2026-10-10',
    organizer: 'CSE Department',
    capacity: 100,
  };

  // 1. Create Event
  test('POST /api/events - Admin should create event successfully', async () => {
    const res = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(validEventData);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('_id');
    expect(res.body.title).toBe('Hackathon 2026');
    expect(res.body.availableSeats).toBe(100);
    eventId = res.body._id;
  });

  test('POST /api/events - Student should not be authorized to create event', async () => {
    const res = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${studentToken}`)
      .send(validEventData);

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/admins only/i);
  });

  test('POST /api/events - Should prevent duplicate event (same title, venue, date)', async () => {
    const res = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(validEventData);

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/already exists/i);
  });

  // 2. Validation failures
  test('POST /api/events - Validate start time before end time', async () => {
    const invalidTimeEvent = {
      ...validEventData,
      title: 'Bad Time Event',
      startTime: '16:00',
      endTime: '12:00', // Invalid: end time before start time
    };

    const res = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(invalidTimeEvent);

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('errors');
    expect(res.body.errors[0].msg).toMatch(/start time must be before end time/i);
  });

  test('POST /api/events - Validate registration deadline not after eventDate', async () => {
    const invalidDeadlineEvent = {
      ...validEventData,
      title: 'Bad Deadline Event',
      eventDate: '2026-10-15',
      registrationDeadline: '2026-10-18', // Invalid: deadline after event date
    };

    const res = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(invalidDeadlineEvent);

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('errors');
    expect(res.body.errors[0].msg).toMatch(/registration deadline cannot be after/i);
  });

  test('POST /api/events - Validate capacity must be greater than zero', async () => {
    const invalidCapacityEvent = {
      ...validEventData,
      title: 'Bad Capacity Event',
      capacity: 0, // Invalid: capacity must be > 0
    };

    const res = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(invalidCapacityEvent);

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('errors');
  });

  // 3. Read Events
  test('GET /api/events - Student can retrieve all events', async () => {
    const res = await request(app)
      .get('/api/events')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  test('GET /api/events/:id - Get details of specific event', async () => {
    const res = await request(app)
      .get(`/api/events/${eventId}`)
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    expect(res.body._id).toBe(eventId);
    expect(res.body.title).toBe('Hackathon 2026');
  });

  test('GET /api/events/:id - Should return 400 for malformed ID', async () => {
    const res = await request(app)
      .get('/api/events/invalid-id-format')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/invalid event id/i);
  });

  test('GET /api/events/:id - Should return 404 for non-existent ID', async () => {
    const nonExistentId = 99999;
    const res = await request(app)
      .get(`/api/events/${nonExistentId}`)
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(404);
  });

  // 4. Update Event
  test('PUT /api/events/:id - Admin can update event details', async () => {
    const res = await request(app)
      .put(`/api/events/${eventId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        ...validEventData,
        title: 'Hackathon 2026 Extended',
        capacity: 150, // Capacity updated
      });

    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Hackathon 2026 Extended');
    expect(res.body.capacity).toBe(150);
    expect(res.body.availableSeats).toBe(150);
  });

  test('PUT /api/events/:id - Student cannot update event', async () => {
    const res = await request(app)
      .put(`/api/events/${eventId}`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send(validEventData);

    expect(res.status).toBe(403);
  });

  // 5. Delete Event
  test('DELETE /api/events/:id - Student cannot delete event', async () => {
    const res = await request(app)
      .delete(`/api/events/${eventId}`)
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(403);
  });

  test('DELETE /api/events/:id - Admin can delete event successfully', async () => {
    const res = await request(app)
      .delete(`/api/events/${eventId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/(deleted|removed) successfully/i);

    // Verify it is gone
    const checkRes = await request(app)
      .get(`/api/events/${eventId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(checkRes.status).toBe(404);
  });

  test('POST /api/events - Admin event creation generates notifications for active students exactly once', async () => {
    const { Student, Notification } = require('../models');
    
    const [testStudent] = await Student.findOrCreate({
      where: { email: 'notif_test@college.edu' },
      defaults: {
        fullName: 'Notif Tester Student',
        rollNumber: 'NT2026001',
        email: 'notif_test@college.edu',
        password: 'password123',
        department: 'CSE',
        year: '4th Year',
        section: 'A',
        isActive: true,
      },
    });

    const initialCount = await Notification.count({
      where: { userId: testStudent.id, userRole: 'Student' },
    });

    const newEventData = {
      title: 'Notified Tech Seminar',
      description: 'Seminar with notification broadcast',
      category: 'Technical',
      eventDate: '2026-12-05',
      startTime: '10:00',
      endTime: '12:00',
      venue: 'Room 101',
      organizer: 'Notif Dept',
      capacity: 40,
      registrationDeadline: '2026-12-04',
    };

    const res = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(newEventData);

    expect(res.status).toBe(201);
    const createdEventId = res.body.id;

    const finalCount = await Notification.count({
      where: { userId: testStudent.id, userRole: 'Student' },
    });
    expect(finalCount).toBe(initialCount + 1);

    const latestNotif = await Notification.findOne({
      where: { userId: testStudent.id, userRole: 'Student' },
      order: [['createdAt', 'DESC']],
    });

    expect(latestNotif.title).toBe('New Event Added');
    expect(latestNotif.message).toContain('A new event "Notified Tech Seminar" has been added. Check the Events page for details.');
    expect(latestNotif.type).toBe('Event');
    expect(latestNotif.referenceId).toBe(createdEventId);
    expect(latestNotif.isRead).toBe(false);
  });

  test('POST /api/events - Failed event creation does NOT generate notifications', async () => {
    const { Student, Notification } = require('../models');
    
    const student = await Student.findOne({ where: { email: 'notif_test@college.edu' } });

    const initialCount = await Notification.count({
      where: { userId: student.id, userRole: 'Student' },
    });

    const invalidEventData = {
      title: 'Failed Notification Event',
      description: 'Capacity is invalid',
      category: 'Technical',
      eventDate: '2026-12-05',
      startTime: '10:00',
      endTime: '12:00',
      venue: 'Room 101',
      organizer: 'Notif Dept',
      capacity: 0,
      registrationDeadline: '2026-12-04',
    };

    const res = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(invalidEventData);

    expect(res.status).toBe(400);

    const finalCount = await Notification.count({
      where: { userId: student.id, userRole: 'Student' },
    });
    expect(finalCount).toBe(initialCount);
  });
});
