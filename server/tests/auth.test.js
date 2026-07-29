const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const request = require('supertest');

let mongoServer;
let app;
let server;

beforeAll(async () => {
  // Start mongo memory server
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  
  // Set MONGODB_URI to the in-memory database
  process.env.MONGODB_URI = uri;
  process.env.JWT_SECRET = 'test_secret_key';
  
  // Import app and server now that MONGODB_URI is set
  const backend = require('../server');
  app = backend.app;
  server = backend.server;
  
  // Wait a small bit to ensure DB connect & seeding completes
  await new Promise((resolve) => setTimeout(resolve, 1000));
});

afterAll(async () => {
  // Close database connections and server
  await mongoose.disconnect();
  await mongoServer.stop();
  await new Promise((resolve) => server.close(resolve));
});

describe('College Event Registration Auth APIs', () => {
  let studentToken;
  let adminToken;
  
  const studentData = {
    fullName: 'John Doe',
    rollNumber: 'CS202601',
    email: 'johndoe@college.edu',
    department: 'Computer Science',
    year: '3rd Year',
    password: 'password123',
  };

  // 1. Student Registration
  test('POST /api/student/register - Successful registration', async () => {
    const res = await request(app)
      .post('/api/student/register')
      .send(studentData);
      
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body.fullName).toBe('John Doe');
    expect(res.body.rollNumber).toBe('CS202601');
    expect(res.body.email).toBe('johndoe@college.edu');
    expect(res.body.role).toBe('Student');
  });

  test('POST /api/student/register - Duplicate email should fail', async () => {
    const duplicateEmailStudent = {
      ...studentData,
      rollNumber: 'CS202602', // different roll number
    };
    
    const res = await request(app)
      .post('/api/student/register')
      .send(duplicateEmailStudent);
      
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/already exists/i);
  });

  test('POST /api/student/register - Duplicate roll number should fail', async () => {
    const duplicateRollStudent = {
      ...studentData,
      email: 'another@college.edu', // different email
    };
    
    const res = await request(app)
      .post('/api/student/register')
      .send(duplicateRollStudent);
      
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/already exists/i);
  });

  test('POST /api/student/register - Missing fields validation', async () => {
    const incompleteStudent = {
      fullName: 'No Roll Number',
      email: 'noroll@college.edu',
      password: 'password123',
    };
    
    const res = await request(app)
      .post('/api/student/register')
      .send(incompleteStudent);
      
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('errors');
    expect(res.body.errors.length).toBeGreaterThan(0);
  });

  test('POST /api/student/register - Short password validation', async () => {
    const badPasswordStudent = {
      ...studentData,
      rollNumber: 'CS202603',
      email: 'badpw@college.edu',
      password: '123',
    };
    
    const res = await request(app)
      .post('/api/student/register')
      .send(badPasswordStudent);
      
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('errors');
  });

  // 2. Student Login
  test('POST /api/student/login - Successful login', async () => {
    const res = await request(app)
      .post('/api/student/login')
      .send({
        email: studentData.email,
        password: studentData.password,
      });
      
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    studentToken = res.body.token;
  });

  test('POST /api/student/login - Invalid password should fail', async () => {
    const res = await request(app)
      .post('/api/student/login')
      .send({
        email: studentData.email,
        password: 'wrongpassword',
      });
      
    expect(res.status).toBe(401);
  });

  // 3. Student Profile Access
  test('GET /api/student/profile - Get profile with valid token', async () => {
    const res = await request(app)
      .get('/api/student/profile')
      .set('Authorization', `Bearer ${studentToken}`);
      
    expect(res.status).toBe(200);
    expect(res.body.email).toBe(studentData.email);
    expect(res.body.rollNumber).toBe(studentData.rollNumber);
  });

  test('GET /api/student/profile - Access denied without token', async () => {
    const res = await request(app)
      .get('/api/student/profile');
      
    expect(res.status).toBe(401);
  });

  // 4. Admin Auth
  test('POST /api/admin/login - Successful seeded admin login', async () => {
    const res = await request(app)
      .post('/api/admin/login')
      .send({
        email: 'admin@college.edu',
        password: 'adminpassword',
      });
      
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.role).toBe('Admin');
    adminToken = res.body.token;
  });

  test('POST /api/admin/login - Invalid credentials should fail', async () => {
    const res = await request(app)
      .post('/api/admin/login')
      .send({
        email: 'admin@college.edu',
        password: 'wrongadminpassword',
      });
      
    expect(res.status).toBe(401);
  });

  test('GET /api/admin/profile - Retrieve admin profile with token', async () => {
    const res = await request(app)
      .get('/api/admin/profile')
      .set('Authorization', `Bearer ${adminToken}`);
      
    expect(res.status).toBe(200);
    expect(res.body.email).toBe('admin@college.edu');
    expect(res.body.role).toBe('Admin');
  });

  // 5. Role-based Route Protection
  test('GET /api/student/profile - Admins should not access student profile', async () => {
    const res = await request(app)
      .get('/api/student/profile')
      .set('Authorization', `Bearer ${adminToken}`);
      
    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/students only/i);
  });

  test('GET /api/admin/profile - Students should not access admin profile', async () => {
    const res = await request(app)
      .get('/api/admin/profile')
      .set('Authorization', `Bearer ${studentToken}`);
      
    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/admins only/i);
  });
});
