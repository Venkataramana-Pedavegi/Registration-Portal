const request = require('supertest');
const { app } = require('../server');
const { sequelize, Student, Event, Registration, Feedback } = require('../models');
const jwt = require('jsonwebtoken');

describe('Event Feedback System Access and Security Test Suite', () => {
  let studentToken, studentId, otherStudentToken, otherStudentId;
  let upcomingEventId, ongoingEventId, completedEventId;

  beforeAll(async () => {
    await sequelize.sync({ force: false });

    // 1. Create student who will register
    const [student] = await Student.findOrCreate({
      where: { email: 'feedbackstudent@college.edu' },
      defaults: {
        fullName: 'Feedback Tester',
        rollNumber: 'FB2026001',
        email: 'feedbackstudent@college.edu',
        password: 'password123',
        department: 'CSE',
        year: '4th Year',
        section: 'A',
      },
    });
    studentId = student.id;
    studentToken = jwt.sign({ id: student.id, role: 'Student' }, process.env.JWT_SECRET || 'secret', { expiresIn: '1h' });

    // 2. Create another student who will NOT register
    const [otherStudent] = await Student.findOrCreate({
      where: { email: 'unregistered@college.edu' },
      defaults: {
        fullName: 'Unregistered Tester',
        rollNumber: 'FB2026002',
        email: 'unregistered@college.edu',
        password: 'password123',
        department: 'ECE',
        year: '3rd Year',
        section: 'B',
      },
    });
    otherStudentId = otherStudent.id;
    otherStudentToken = jwt.sign({ id: otherStudent.id, role: 'Student' }, process.env.JWT_SECRET || 'secret', { expiresIn: '1h' });

    // 3. Create upcoming event (in the future)
    const upcomingEvent = await Event.create({
      title: 'Upcoming Tech Summit',
      description: 'Event occurring tomorrow',
      category: 'Technical',
      eventDate: new Date(Date.now() + 86400000), // Tomorrow
      startTime: '09:00 AM',
      endTime: '05:00 PM',
      venue: 'Seminar Hall 1',
      organizer: 'Technical Club',
      capacity: 100,
      availableSeats: 100,
      registrationDeadline: new Date(Date.now() + 43200000),
      status: 'Upcoming',
      createdBy: 1,
    });
    upcomingEventId = upcomingEvent.id;

    // 4. Create ongoing event (started today, ends in future)
    const ongoingDate = new Date();
    const futureTime = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours from now
    const ongoingEndTime = `${String(futureTime.getHours()).padStart(2, '0')}:${String(futureTime.getMinutes()).padStart(2, '0')}`;
    const ongoingEventDate = futureTime.getDate() !== ongoingDate.getDate() ? new Date(Date.now() + 86400000) : ongoingDate;

    const ongoingEvent = await Event.create({
      title: 'Ongoing Hackathon',
      description: 'Event occurring right now',
      category: 'Technical',
      eventDate: ongoingEventDate,
      startTime: '08:00 AM',
      endTime: ongoingEndTime,
      venue: 'Lab 3',
      organizer: 'Coding Club',
      capacity: 50,
      availableSeats: 50,
      registrationDeadline: new Date(Date.now() - 43200000),
      status: 'Ongoing',
      createdBy: 1,
    });
    ongoingEventId = ongoingEvent.id;

    // 5. Create completed event (ended yesterday)
    const completedEvent = await Event.create({
      title: 'Completed Workshop',
      description: 'Event that has finished yesterday',
      category: 'Technical',
      eventDate: new Date(Date.now() - 86400000), // Yesterday
      startTime: '09:00 AM',
      endTime: '04:00 PM',
      venue: 'Main Seminar Hall',
      organizer: 'Web Club',
      capacity: 30,
      availableSeats: 30,
      registrationDeadline: new Date(Date.now() - 172800000),
      status: 'Completed',
      createdBy: 1,
    });
    completedEventId = completedEvent.id;

    // 6. Register 'student' to all events
    await Registration.create({ studentId, eventId: upcomingEventId, status: 'Registered' });
    await Registration.create({ studentId, eventId: ongoingEventId, status: 'Registered' });
    await Registration.create({ studentId, eventId: completedEventId, status: 'Registered' });
  });

  test('1. Reject feedback if student is not registered', async () => {
    const res = await request(app)
      .post('/api/feedback')
      .set('Authorization', `Bearer ${otherStudentToken}`)
      .send({ eventId: completedEventId, rating: 5, comment: 'Great event!' });

    expect(res.statusCode).toBe(403);
    expect(res.body.message).toContain('You must be registered for this event to give feedback.');
  });

  test('2. Reject feedback submission for upcoming event', async () => {
    const res = await request(app)
      .post('/api/feedback')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ eventId: upcomingEventId, rating: 4, comment: 'Nice upcoming plan!' });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Feedback is available only after the event is completed.');
  });

  test('3. Reject feedback submission for ongoing event', async () => {
    const res = await request(app)
      .post('/api/feedback')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ eventId: ongoingEventId, rating: 5, comment: 'Loving it so far!' });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Feedback is available only after the event is completed.');
  });

  test('4. Accept feedback submission for completed event', async () => {
    const res = await request(app)
      .post('/api/feedback')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ eventId: completedEventId, rating: 5, comment: 'Amazing completed event!' });

    expect(res.statusCode).toBe(201);
    expect(res.body.message).toContain('Feedback submitted successfully');
    expect(res.body.feedback.rating).toBe(5);
  });

  test('5. Support duplicate submission to update rating and comment', async () => {
    const res = await request(app)
      .post('/api/feedback')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ eventId: completedEventId, rating: 4, comment: 'Updated comment: it was good.' });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toContain('Feedback updated successfully');
    expect(res.body.feedback.rating).toBe(4);
    expect(res.body.feedback.comment).toBe('Updated comment: it was good.');
  });
});
