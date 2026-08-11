const request = require('supertest');
const { app } = require('../server');
const { sequelize, Student, Admin, Event, Registration, Volunteer, Feedback, Certificate, Notification } = require('../models');
const jwt = require('jsonwebtoken');

describe('Admin Notifications and Triggers System Test Suite', () => {
  let studentToken, studentId, studentName;
  let adminToken, adminId;
  let testEvent;

  beforeAll(async () => {
    // Sync DB but keep records
    await sequelize.sync({ force: false });

    // 1. Create student
    const [student] = await Student.findOrCreate({
      where: { email: 'notif_student@college.edu' },
      defaults: {
        fullName: 'Notification Student',
        rollNumber: 'NS202611',
        email: 'notif_student@college.edu',
        password: 'password123',
        department: 'CSE',
        year: '3rd Year',
        section: 'A',
        isActive: true,
      },
    });
    studentId = student.id;
    studentName = student.fullName;
    studentToken = jwt.sign({ id: student.id, role: 'Student' }, process.env.JWT_SECRET || 'secret', { expiresIn: '1h' });

    // 2. Create active admin
    const [admin] = await Admin.findOrCreate({
      where: { email: 'notif_admin@college.edu' },
      defaults: {
        username: 'notif_admin',
        email: 'notif_admin@college.edu',
        password: 'adminpassword123',
        role: 'Admin',
        isActive: true,
      },
    });
    adminId = admin.id;
    adminToken = jwt.sign({ id: admin.id, role: 'Admin' }, process.env.JWT_SECRET || 'secret', { expiresIn: '1h' });

    // 3. Create a test event (set in future initially so student registration succeeds)
    testEvent = await Event.create({
      title: 'Notification Testing Summit',
      description: 'System event for testing notifications',
      category: 'Technical',
      eventDate: new Date(Date.now() + 86400000), // Tomorrow
      startTime: '09:00',
      endTime: '11:00',
      venue: 'Main Lab',
      organizer: 'CSE Dept',
      capacity: 50,
      availableSeats: 50,
      registrationDeadline: new Date(Date.now() + 43200000), // In 12h
      status: 'Upcoming',
      createdBy: admin.id,
    });
  });

  afterAll(async () => {
    // Cleanup created records
    await Notification.destroy({ where: { userId: [adminId, studentId] } });
    if (testEvent) {
      await Registration.destroy({ where: { eventId: testEvent.id } });
      await Volunteer.destroy({ where: { eventId: testEvent.id } });
      await Feedback.destroy({ where: { eventId: testEvent.id } });
      await Certificate.destroy({ where: { eventId: testEvent.id } });
      await testEvent.destroy();
    }
  });

  test('TEST 1 & A: Student registers for event -> Admin receives notification', async () => {
    // Record initial notification count for admin
    const initialCount = await Notification.count({
      where: { userId: adminId, userRole: 'Admin', title: 'New Event Registration' },
    });

    const res = await request(app)
      .post('/api/registrations')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ eventId: testEvent.id });

    expect(res.status).toBe(201);

    const finalCount = await Notification.count({
      where: { userId: adminId, userRole: 'Admin', title: 'New Event Registration' },
    });
    expect(finalCount).toBe(initialCount + 1);

    const latestNotif = await Notification.findOne({
      where: { userId: adminId, userRole: 'Admin', title: 'New Event Registration' },
      order: [['createdAt', 'DESC']],
    });
    expect(latestNotif.message).toContain(`${studentName} registered for ${testEvent.title}.`);
  });

  test('TEST 2 & B: Student applies as volunteer -> Admin receives New Volunteer Application notification', async () => {
    const initialCount = await Notification.count({
      where: { userId: adminId, userRole: 'Admin', title: 'New Volunteer Application' },
    });

    const res = await request(app)
      .post('/api/volunteers/apply')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ eventId: testEvent.id, department: 'Technical', skills: 'React coding' });

    expect(res.status).toBe(201);

    const finalCount = await Notification.count({
      where: { userId: adminId, userRole: 'Admin', title: 'New Volunteer Application' },
    });
    expect(finalCount).toBe(initialCount + 1);

    const latestNotif = await Notification.findOne({
      where: { userId: adminId, userRole: 'Admin', title: 'New Volunteer Application' },
      order: [['createdAt', 'DESC']],
    });
    expect(latestNotif.message).toContain(`${studentName} applied to volunteer for ${testEvent.title}.`);
  });

  test('TEST 3 & C: Student submits feedback -> Admin receives New Event Feedback notification', async () => {
    // Move event and deadline to past so it registers as completed event
    testEvent.eventDate = new Date(Date.now() - 86400000); // Yesterday
    testEvent.endTime = '08:00 AM'; // morning
    testEvent.registrationDeadline = new Date(Date.now() - 172800000);
    await testEvent.save();

    const initialCount = await Notification.count({
      where: { userId: adminId, userRole: 'Admin', title: 'New Event Feedback' },
    });

    // Make sure we have a registration
    const registration = await Registration.findOne({
      where: { studentId, eventId: testEvent.id },
    });
    expect(registration).not.toBeNull();

    // Force registration status to Completed to allow feedback
    registration.status = 'Completed';
    await registration.save();

    const res = await request(app)
      .post('/api/feedback')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ eventId: testEvent.id, rating: 5, comment: 'Exceptional event!' });

    expect(res.status).toBe(201);

    const finalCount = await Notification.count({
      where: { userId: adminId, userRole: 'Admin', title: 'New Event Feedback' },
    });
    expect(finalCount).toBe(initialCount + 1);

    const latestNotif = await Notification.findOne({
      where: { userId: adminId, userRole: 'Admin', title: 'New Event Feedback' },
      order: [['createdAt', 'DESC']],
    });
    expect(latestNotif.message).toContain(`${studentName} submitted feedback for ${testEvent.title}.`);
  });

  test('TEST 4 & D: Admin creates event -> Student receives New Event Added, Admin receives Event Created', async () => {
    const adminInitial = await Notification.count({
      where: { userId: adminId, userRole: 'Admin', title: 'Event Created' },
    });
    const studentInitial = await Notification.count({
      where: { userId: studentId, userRole: 'Student', title: 'New Event Added' },
    });

    const newEventData = {
      title: 'Fresh Notification Event',
      description: 'Creating event to verify notifications',
      category: 'Technical',
      eventDate: '2026-11-20',
      startTime: '10:00',
      endTime: '12:00',
      venue: 'Main Lab A',
      organizer: 'CSE Dept',
      capacity: 30,
      registrationDeadline: '2026-11-18',
    };

    const res = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(newEventData);

    expect(res.status).toBe(201);
    const createdEventId = res.body.id;

    // Admin should get "Event Created"
    const adminFinal = await Notification.count({
      where: { userId: adminId, userRole: 'Admin', title: 'Event Created' },
    });
    expect(adminFinal).toBe(adminInitial + 1);

    // Student should get "New Event Added"
    const studentFinal = await Notification.count({
      where: { userId: studentId, userRole: 'Student', title: 'New Event Added' },
    });
    expect(studentFinal).toBe(studentInitial + 1);

    // Clean up created event
    await Event.destroy({ where: { id: createdEventId } });
  });

  test('TEST 5 & E: Admin updates event -> Admin receives Event Updated notification', async () => {
    const initialCount = await Notification.count({
      where: { userId: adminId, userRole: 'Admin', title: 'Event Updated' },
    });

    const updatePayload = {
      title: 'Notification Testing Summit v2',
      description: 'System event for testing notifications',
      category: 'Technical',
      eventDate: '2026-12-05',
      startTime: '10:00',
      endTime: '12:00',
      venue: 'Main Lab',
      organizer: 'CSE Dept',
      capacity: 50,
      registrationDeadline: '2026-12-04',
    };

    const res = await request(app)
      .put(`/api/events/${testEvent.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send(updatePayload);

    expect(res.status).toBe(200);

    const finalCount = await Notification.count({
      where: { userId: adminId, userRole: 'Admin', title: 'Event Updated' },
    });
    expect(finalCount).toBe(initialCount + 1);
  });

  test('TEST 6 & F: Admin cancels event -> Admin receives Event Cancelled notification', async () => {
    const initialCount = await Notification.count({
      where: { userId: adminId, userRole: 'Admin', title: 'Event Cancelled' },
    });

    const cancelPayload = {
      title: 'Notification Testing Summit v2',
      description: 'System event for testing notifications',
      category: 'Technical',
      eventDate: '2026-12-05',
      startTime: '10:00',
      endTime: '12:00',
      venue: 'Main Lab',
      organizer: 'CSE Dept',
      capacity: 50,
      registrationDeadline: '2026-12-04',
      status: 'Cancelled',
    };

    const res = await request(app)
      .put(`/api/events/${testEvent.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send(cancelPayload);

    expect(res.status).toBe(200);

    const finalCount = await Notification.count({
      where: { userId: adminId, userRole: 'Admin', title: 'Event Cancelled' },
    });
    expect(finalCount).toBe(initialCount + 1);
  });

  test('TEST 7 & G: Certificates generated -> Admin receives Certificates Generated notification', async () => {
    const initialCount = await Notification.count({
      where: { userId: adminId, userRole: 'Admin', title: 'Certificates Generated' },
    });

    // Generate certificate manually using database creation to trigger hook
    const registration = await Registration.findOne({ where: { studentId, eventId: testEvent.id } });
    expect(registration).not.toBeNull();

    const certificate = await Certificate.create({
      registrationId: registration.id,
      studentId,
      eventId: testEvent.id,
      certificateId: `TEST-CERT-${registration.id}`,
      issueDate: new Date(),
      qrVerificationCode: `TEST-CERT-${registration.id}`,
    });

    expect(certificate).toBeDefined();

    const finalCount = await Notification.count({
      where: { userId: adminId, userRole: 'Admin', title: 'Certificates Generated' },
    });
    expect(finalCount).toBe(initialCount + 1);
  });

  test('TEST 8 & H: Entry verified -> Admin receives Event Entry Verified notification', async () => {
    const initialCount = await Notification.count({
      where: { userId: adminId, userRole: 'Admin', title: 'Event Entry Verified' },
    });

    const registration = await Registration.findOne({ where: { studentId, eventId: testEvent.id } });
    expect(registration).not.toBeNull();
    
    // Set status back to Registered so entry verification can succeed
    registration.status = 'Registered';
    await registration.save();

    const res = await request(app)
      .post('/api/admin/entry/verify')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ registrationId: registration.id });

    expect(res.status).toBe(200);

    const finalCount = await Notification.count({
      where: { userId: adminId, userRole: 'Admin', title: 'Event Entry Verified' },
    });
    expect(finalCount).toBe(initialCount + 1);

    const latestNotif = await Notification.findOne({
      where: { userId: adminId, userRole: 'Admin', title: 'Event Entry Verified' },
      order: [['createdAt', 'DESC']],
    });
    expect(latestNotif.message).toContain(`${studentName}'s entry for Notification Testing Summit v2 was verified.`);
  });

  test('TEST 9: Student attempts to access Admin notifications -> access filtered or denied', async () => {
    // Create an Admin notification explicitly
    const adminNotif = await Notification.create({
      userId: adminId,
      userRole: 'Admin',
      title: 'Secret Admin Message',
      message: 'This should not be visible to students.',
      type: 'System',
    });

    // Make request as student to fetch notifications
    const res = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    
    // Check if the student received the admin's notification
    const receivedAdminNotif = res.body.notifications.some(
      n => n.title === 'Secret Admin Message' || n.id === adminNotif.id
    );
    expect(receivedAdminNotif).toBe(false);

    // Clean up
    await adminNotif.destroy();
  });

  test('TEST 10: Admin with Super Admin or custom admin role can fetch Admin notifications successfully', async () => {
    // Create super admin
    const [superAdmin] = await Admin.findOrCreate({
      where: { email: 'super_notif_admin@college.edu' },
      defaults: {
        username: 'super_notif_admin',
        email: 'super_notif_admin@college.edu',
        password: 'adminpassword123',
        role: 'Super Admin',
        isActive: true,
      },
    });

    const superAdminToken = jwt.sign({ id: superAdmin.id, role: 'Super Admin' }, process.env.JWT_SECRET || 'secret', { expiresIn: '1h' });

    // Insert notification for Super Admin
    const superNotif = await Notification.create({
      userId: superAdmin.id,
      userRole: 'Admin',
      title: 'Super Admin Broadcast',
      message: 'System upgrade scheduled',
      type: 'System',
    });

    const res = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${superAdminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.notifications.length).toBeGreaterThan(0);
    const found = res.body.notifications.some(n => n.id === superNotif.id);
    expect(found).toBe(true);

    await superNotif.destroy();
  });
});
