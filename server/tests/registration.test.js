const request = require('supertest');
const { sequelize, Admin, Student, Event, Registration } = require('../models');
const initDb = require('../utils/initDb');

let app;
let server;

beforeAll(async () => {
  process.env.JWT_SECRET = 'registration_test_secret_key';
  
  // Recreate all tables fresh in the test database
  await initDb();
  await sequelize.sync({ force: true });
  
  // Seed admin user
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
  
  await new Promise((resolve) => setTimeout(resolve, 500));
});

afterAll(async () => {
  await sequelize.close();
  await new Promise((resolve) => server.close(resolve));
});

describe('College Event Registration Event Registration APIs', () => {
  let adminToken;
  let studentAToken;
  let studentBToken;
  let studentAId;
  let studentBId;
  let activeEventId;
  let closedEventId;
  let fullEventId;
  let registrationId;

  beforeAll(async () => {
    // 1. Admin login
    const adminRes = await request(app)
      .post('/api/admin/login')
      .send({ email: 'admin@college.edu', password: 'adminpassword' });
    adminToken = adminRes.body.token;

    // 2. Register Student A
    const studentARes = await request(app)
      .post('/api/student/register')
      .send({
        fullName: 'Student A',
        rollNumber: 'CS2026A',
        email: 'studenta@college.edu',
        department: 'Computer Science',
        year: '3rd Year',
        password: 'password123',
      });
    studentAToken = studentARes.body.token;
    studentAId = studentARes.body._id;

    // 3. Register Student B
    const studentBRes = await request(app)
      .post('/api/student/register')
      .send({
        fullName: 'Student B',
        rollNumber: 'CS2026B',
        email: 'studentb@college.edu',
        department: 'Electronics',
        year: '2nd Year',
        password: 'password123',
      });
    studentBToken = studentBRes.body.token;
    studentBId = studentBRes.body._id;

    // 4. Create Active Event
    const eventRes = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Active Tech Event',
        description: 'An open tech event.',
        category: 'Technical',
        venue: 'Seminar Hall 1',
        eventDate: '2026-11-20',
        startTime: '09:00',
        endTime: '12:00',
        registrationDeadline: '2026-11-15',
        organizer: 'CSE Dept',
        capacity: 50,
      });
    activeEventId = eventRes.body._id;

    // 5. Create Event with passed deadline
    const closedEventRes = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Closed Event',
        description: 'Deadline passed.',
        category: 'Technical',
        venue: 'Seminar Hall 2',
        eventDate: '2026-08-01',
        startTime: '09:00',
        endTime: '12:00',
        registrationDeadline: '2026-07-28', // Deadline is in the past relative to current time 2026-07-29
        organizer: 'ECE Dept',
        capacity: 10,
      });
    closedEventId = closedEventRes.body._id;

    // 6. Create Event with capacity = 1 and availableSeats = 0
    const fullEventRes = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Full Event',
        description: 'No seats left.',
        category: 'Sports',
        venue: 'Playground',
        eventDate: '2026-11-25',
        startTime: '09:00',
        endTime: '12:00',
        registrationDeadline: '2026-11-20',
        organizer: 'Sports Club',
        capacity: 1,
      });
    fullEventId = fullEventRes.body._id;
    
    // Manually force availableSeats = 0 to simulate full event
    const fullEvent = await Event.findByPk(fullEventId);
    fullEvent.availableSeats = 0;
    await fullEvent.save();
  });

  // Test register
  test('POST /api/registrations - Register student successfully and create in-app notification', async () => {
    const res = await request(app)
      .post('/api/registrations')
      .set('Authorization', `Bearer ${studentAToken}`)
      .send({ eventId: activeEventId });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.status).toBe('Registered');
    registrationId = res.body.id;

    // Verify seats decremented by 1
    const event = await Event.findByPk(activeEventId);
    expect(event.availableSeats).toBe(49);

    // Verify Notification created for student in Database
    const { Notification } = require('../models');
    const notif = await Notification.findOne({
      where: { userId: studentAId, userRole: 'Student', type: 'Registration' },
    });
    expect(notif).not.toBeNull();
    expect(notif.title).toMatch(/Registration Successful/i);

    // Verify Student Notification API retrieves the notification
    const notifRes = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${studentAToken}`);

    expect(notifRes.status).toBe(200);
    expect(notifRes.body.notifications.length).toBeGreaterThan(0);
    expect(notifRes.body.unreadCount).toBeGreaterThan(0);
  });

  test('POST /api/registrations - Registration succeeds even if email sending encounters an error', async () => {
    const res = await request(app)
      .post('/api/registrations')
      .set('Authorization', `Bearer ${studentBToken}`)
      .send({ eventId: activeEventId });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.status).toBe('Registered');

    // Verify student B notification created despite email simulation
    const { Notification, Registration: RegModel, Event: EventModel } = require('../models');
    const notifB = await Notification.findOne({
      where: { userId: studentBId, userRole: 'Student', type: 'Registration' },
    });
    expect(notifB).not.toBeNull();

    // Clean up student B test registration so seat count remains 49 for subsequent tests
    await RegModel.destroy({ where: { id: res.body.id } });
    const ev = await EventModel.findByPk(activeEventId);
    ev.availableSeats = 49;
    await ev.save();
  });

  test('POST /api/registrations - Prevent duplicate registration', async () => {
    const res = await request(app)
      .post('/api/registrations')
      .set('Authorization', `Bearer ${studentAToken}`)
      .send({ eventId: activeEventId });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/already registered/i);
  });

  test('POST /api/registrations - Prevent registration after deadline', async () => {
    const res = await request(app)
      .post('/api/registrations')
      .set('Authorization', `Bearer ${studentAToken}`)
      .send({ eventId: closedEventId });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/deadline has passed/i);
  });

  test('POST /api/registrations - Prevent registration for full event', async () => {
    const res = await request(app)
      .post('/api/registrations')
      .set('Authorization', `Bearer ${studentAToken}`)
      .send({ eventId: fullEventId });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/event is full/i);
  });

  // Test Cancellation
  test('DELETE /api/registrations/:id - Prevent cancellation by unauthorized student', async () => {
    const res = await request(app)
      .delete(`/api/registrations/${registrationId}`)
      .set('Authorization', `Bearer ${studentBToken}`);

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/unauthorized/i);
  });

  test('DELETE /api/registrations/:id - Cancel registration successfully', async () => {
    const res = await request(app)
      .delete(`/api/registrations/${registrationId}`)
      .set('Authorization', `Bearer ${studentAToken}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/cancelled successfully/i);

    // Verify seats incremented back to 50
    const event = await Event.findByPk(activeEventId);
    expect(event.availableSeats).toBe(50);
  });

  test('DELETE /api/registrations/:id - Prevent duplicate cancellation', async () => {
    const res = await request(app)
      .delete(`/api/registrations/${registrationId}`)
      .set('Authorization', `Bearer ${studentAToken}`);

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/already cancelled/i);
  });

  // Test View Participants
  test('GET /api/events/:id/participants - Admin retrieve participants list', async () => {
    // Register Student B to active event first so we have at least one active participant
    await request(app)
      .post('/api/registrations')
      .set('Authorization', `Bearer ${studentBToken}`)
      .send({ eventId: activeEventId });

    const res = await request(app)
      .get(`/api/events/${activeEventId}/participants`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    expect(['Student A', 'Student B']).toContain(res.body[0].Student.fullName);
  });

  // Test Dashboard Stats
  test('GET /api/admin/registrations - Admin stats values check', async () => {
    const res = await request(app)
      .get('/api/admin/registrations')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('totalRegistrations');
    expect(res.body).toHaveProperty('seatsFilled');
    expect(res.body).toHaveProperty('availableSeats');
  });
});
