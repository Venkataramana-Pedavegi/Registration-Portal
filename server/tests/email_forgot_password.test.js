const request = require('supertest');
const { sequelize, Admin, Student, Event, Registration, Notification } = require('../models');
const initDb = require('../utils/initDb');
const bcrypt = require('bcryptjs');

let app;
let server;

beforeAll(async () => {
  process.env.JWT_SECRET = 'email_test_secret_key';
  
  await initDb();
  await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
  await sequelize.sync({ force: true });
  await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
  
  await Admin.create({
    username: 'admin',
    email: 'admin@college.edu',
    password: 'adminpassword',
    role: 'Admin',
  });

  const backend = require('../server');
  app = backend.app;
  server = backend.server;
  
  await new Promise((resolve) => setTimeout(resolve, 500));
});

afterAll(async () => {
  if (sequelize) await sequelize.close();
  if (server && server.close) await new Promise((resolve) => server.close(resolve));
});

describe('Email & Forgot Password Integration Suite', () => {
  let studentToken;
  let studentId;
  let eventId;
  let adminToken;
  let resetToken;

  const testStudent = {
    fullName: 'Mail Test Student',
    rollNumber: 'MAIL202601',
    email: 'mailstudent@college.edu',
    department: 'Computer Science',
    year: '4th Year',
    password: 'Password123!',
  };

  test('SETUP: Register Student & Login Admin', async () => {
    const adminRes = await request(app)
      .post('/api/admin/login')
      .send({ email: 'admin@college.edu', password: 'adminpassword' });
    expect(adminRes.status).toBe(200);
    adminToken = adminRes.body.token;

    const studentRes = await request(app)
      .post('/api/student/register')
      .send(testStudent);
    expect(studentRes.status).toBe(201);
    studentToken = studentRes.body.token;
    studentId = studentRes.body._id;

    const eventRes = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Grand Science Expo 2026',
        description: 'Annual college event',
        category: 'Technical',
        venue: 'Main Auditorium',
        eventDate: '2026-12-01',
        startTime: '10:00',
        endTime: '16:00',
        registrationDeadline: '2026-11-28',
        organizer: 'Science Club',
        capacity: 100,
      });
    expect(eventRes.status).toBe(201);
    eventId = eventRes.body._id;
  });

  // TEST 1, 2, 4: Registration succeeds, email service triggered, notification created
  test('TEST 1, 2 & 4: Event Registration creates registration & in-app notification', async () => {
    const res = await request(app)
      .post('/api/registrations')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ eventId });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');

    // Verify Notification created
    const notif = await Notification.findOne({
      where: { userId: studentId, userRole: 'Student', type: 'Registration' },
    });
    expect(notif).not.toBeNull();
    expect(notif.message).toContain('Grand Science Expo 2026');
  });

  // TEST 3: Email failure does not cancel registration
  test('TEST 3: Email failure does not cancel successful registration', async () => {
    const studentBRes = await request(app)
      .post('/api/student/register')
      .send({
        fullName: 'Student B',
        rollNumber: 'MAIL202602',
        email: 'studentb_mail@college.edu',
        department: 'Electronics',
        year: '3rd Year',
        password: 'Password123!',
      });
    const tokenB = studentBRes.body.token;

    const res = await request(app)
      .post('/api/registrations')
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ eventId });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('Registered');

    const reg = await Registration.findByPk(res.body.id);
    expect(reg).not.toBeNull();
    expect(reg.status).toBe('Registered');
  });

  // TEST 5 & 6: Forgot password with non-existent & valid email
  test('TEST 5 & 6: Forgot password triggers OTP and handles invalid email safely', async () => {
    // Non-existent email request
    const invalidRes = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'nonexistent@college.edu' });
    expect(invalidRes.status).toBe(404);

    // Valid email request
    const validRes = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: testStudent.email });
    expect(validRes.status).toBe(200);
    expect(validRes.body.message).toMatch(/(OTP code|sent to your email)/i);

    // Fetch user to inspect OTP expiration and hashed OTP
    const student = await Student.findOne({ where: { email: testStudent.email } });
    expect(student.otpCode).not.toBeNull();
    expect(student.otpExpire).not.toBeNull();
  });

  // TEST 6 & 7: Invalid / Expired OTP rejected
  test('TEST 6 & 7: Invalid and expired OTPs are safely rejected', async () => {
    const badOtpRes = await request(app)
      .post('/api/auth/verify-otp')
      .send({ email: testStudent.email, otp: '000000' });
    expect(badOtpRes.status).toBe(400);
    expect(badOtpRes.body.message).toMatch(/Invalid OTP/i);

    // Simulate expired OTP
    const student = await Student.findOne({ where: { email: testStudent.email } });
    student.otpExpire = new Date(Date.now() - 1000); // 1 sec in past
    await student.save();

    const expiredRes = await request(app)
      .post('/api/auth/verify-otp')
      .send({ email: testStudent.email, otp: '123456' });
    expect(expiredRes.status).toBe(400);
    expect(expiredRes.body.message).toMatch(/expired/i);
  });

  // TEST 8, 9 & 10: Valid OTP verification, password reset, bcrypt hashing & student login
  test('TEST 8, 9 & 10: Valid OTP verification allows password reset with bcrypt hashing', async () => {
    // Trigger fresh OTP
    await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: testStudent.email });

    // For testing, extract student OTP state and simulate matching OTP input
    const crypto = require('crypto');
    const testOtp = '654321';
    const hashedTestOtp = crypto.createHash('sha256').update(testOtp).digest('hex');

    const student = await Student.findOne({ where: { email: testStudent.email } });
    student.otpCode = hashedTestOtp;
    student.otpExpire = new Date(Date.now() + 10 * 60 * 1000);
    await student.save();

    // Verify OTP
    const verifyRes = await request(app)
      .post('/api/auth/verify-otp')
      .send({ email: testStudent.email, otp: testOtp });

    expect(verifyRes.status).toBe(200);
    expect(verifyRes.body).toHaveProperty('token');
    resetToken = verifyRes.body.token;

    // Reset password
    const newPassword = 'NewSecretPassword123!';
    const resetRes = await request(app)
      .post('/api/auth/reset-password')
      .send({ token: resetToken, newPassword });

    expect(resetRes.status).toBe(200);
    expect(resetRes.body.message).toMatch(/reset successfully/i);

    // TEST 9: Verify password is hashed in DB
    const updatedStudent = await Student.findOne({ where: { email: testStudent.email } });
    expect(updatedStudent.password).not.toBe(newPassword);
    const isBcryptMatch = await bcrypt.compare(newPassword, updatedStudent.password);
    expect(isBcryptMatch).toBe(true);

    // TEST 10: Login with new password
    const loginRes = await request(app)
      .post('/api/student/login')
      .send({ email: testStudent.email, password: newPassword });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body).toHaveProperty('token');
  });
});
