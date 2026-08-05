const request = require('supertest');
const { sequelize, Admin, Event, EventGallery } = require('../models');
const initDb = require('../utils/initDb');
const fs = require('fs');
const path = require('path');

let app;
let server;
const testFilePath = path.join(__dirname, 'test-file.jpg');

beforeAll(async () => {
  process.env.JWT_SECRET = 'gallery_test_secret_key';
  await initDb();
  await sequelize.sync({ force: true });

  // Create dummy image file for multer upload test
  fs.writeFileSync(testFilePath, 'dummy image content');

  // Create admin user for testing
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
  if (fs.existsSync(testFilePath)) {
    fs.unlinkSync(testFilePath);
  }
  await sequelize.close();
  await new Promise((resolve) => server.close(resolve));
});

describe('College Event Gallery API Endpoints', () => {
  let adminToken;
  let studentToken;
  let testEventId;
  let mediaId;

  beforeAll(async () => {
    // Login admin
    const adminRes = await request(app)
      .post('/api/admin/login')
      .send({ email: 'admin@college.edu', password: 'adminpassword' });
    adminToken = adminRes.body.token;

    // Register a student
    const studentRes = await request(app)
      .post('/api/student/register')
      .send({
        fullName: 'Jane Doe',
        rollNumber: 'CS202699',
        email: 'janedoe@college.edu',
        department: 'Computer Science',
        year: '3rd Year',
        password: 'studentpassword123',
      });
    studentToken = studentRes.body.token;

    // Create a test event
    const eventRes = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Annual Symposium 2026',
        description: 'Completed annual tech fest.',
        category: 'Technical',
        venue: 'Decennial Block Auditorium',
        eventDate: '2026-08-01',
        startTime: '10:00',
        endTime: '16:00',
        registrationDeadline: '2026-07-30',
        organizer: 'CSE Dept',
        capacity: 150,
      });
    testEventId = eventRes.body._id;
  });

  test('POST /api/gallery - Admin can upload event gallery media items', async () => {
    const res = await request(app)
      .post('/api/gallery')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        eventId: testEventId,
        title: 'Opening Ceremony',
        description: 'lighting of the lamp highlight',
        mediaType: 'IMAGE',
        mediaUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87',
        isFeatured: true,
      });

    expect(res.status).toBe(201);
    expect(res.body.media).toHaveProperty('id');
    expect(res.body.media.title).toBe('Opening Ceremony');
    expect(res.body.media.isFeatured).toBe(true);
    mediaId = res.body.media.id;
  });

  test('POST /api/gallery - Student cannot upload event gallery media', async () => {
    const res = await request(app)
      .post('/api/gallery')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        eventId: testEventId,
        title: 'Unauthorized image',
        mediaUrl: 'https://example.com/unauthorized.jpg',
      });

    expect(res.status).toBe(403);
  });

  test('POST /api/gallery/upload - Admin can upload files using multer', async () => {
    const res = await request(app)
      .post('/api/gallery/upload')
      .set('Authorization', `Bearer ${adminToken}`)
      .field('eventId', testEventId)
      .field('title', 'Annual Fest Poster')
      .field('description', 'Official Symposium Banner')
      .field('mediaType', 'IMAGE')
      .field('isFeatured', 'true')
      .attach('files', testFilePath);

    expect(res.status).toBe(201);
    expect(res.body.message).toContain('uploaded successfully');
    expect(res.body.media[0].title).toBe('Annual Fest Poster');
    expect(res.body.media[0].mediaUrl).toContain('/uploads/gallery/');
  });

  test('GET /api/gallery - Public can retrieve paginated gallery items', async () => {
    const res = await request(app).get('/api/gallery');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('media');
    expect(res.body.media.length).toBeGreaterThan(0);
    expect(res.body).toHaveProperty('pagination');
  });

  test('GET /api/gallery/event/:eventId - Public can retrieve event specific gallery', async () => {
    const res = await request(app).get(`/api/gallery/event/${testEventId}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0].title).toBe('Opening Ceremony');
  });

  test('POST /api/gallery/:id/view - Public can increment view statistics', async () => {
    const res = await request(app).post(`/api/gallery/${mediaId}/view`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.views).toBe(1);
  });

  test('POST /api/gallery/:id/download - Public can increment download statistics', async () => {
    const res = await request(app).post(`/api/gallery/${mediaId}/download`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.downloads).toBe(1);
  });

  test('GET /api/gallery/analytics - Admin can view gallery dashboard stats', async () => {
    const res = await request(app)
      .get('/api/gallery/analytics')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('totalImages');
    expect(res.body.totalImages).toBe(2);
    expect(res.body.mostViewedGallery.title).toBe('Annual Symposium 2026');
  });

  test('PUT /api/gallery/:id - Admin can update media details', async () => {
    const res = await request(app)
      .put(`/api/gallery/${mediaId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Updated Opening Ceremony',
        description: 'New Description text',
        isFeatured: false,
      });

    expect(res.status).toBe(200);
    expect(res.body.media.title).toBe('Updated Opening Ceremony');
    expect(res.body.media.isFeatured).toBe(false);
  });

  test('PATCH /api/gallery/reorder - Admin can reorder media items', async () => {
    const res = await request(app)
      .patch('/api/gallery/reorder')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        orderings: [{ id: mediaId, displayOrder: 10 }],
      });

    expect(res.status).toBe(200);
    expect(res.body.message).toContain('order updated');
  });

  test('DELETE /api/gallery/:id - Admin can delete media items', async () => {
    const res = await request(app)
      .delete(`/api/gallery/${mediaId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toContain('deleted successfully');
  });
});
