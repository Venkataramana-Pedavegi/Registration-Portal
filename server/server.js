const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { sequelize, Admin } = require('./models');

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Seed Admin User if none exists
const seedAdmin = async () => {
  try {
    const adminCount = await Admin.count();
    if (adminCount === 0) {
      console.log('No admin users found. Seeding default admin...');
      await Admin.create({
        username: 'admin',
        email: 'admin@college.edu',
        password: 'adminpassword', // Will be hashed by the model hook
        role: 'Admin',
      });
      console.log('Default Admin seeded successfully: admin@college.edu / adminpassword');
    }
  } catch (error) {
    console.error('Error seeding admin user:', error.message);
  }
};

const initDb = require('./utils/initDb');

// Database Connection & Syncing
const startDb = async () => {
  await initDb();
  try {
    await sequelize.authenticate();
    console.log('MySQL Database Connected successfully...');
    await sequelize.sync();
    console.log('Database tables synchronized successfully.');
    await seedAdmin();
  } catch (err) {
    console.error('Database connection or synchronization failed:', err.message);
  }
};
startDb();

// Routes
app.use('/api/student', require('./routes/studentRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/events', require('./routes/eventRoutes'));

// Root Endpoint
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the College Event Registration API' });
});

// Custom 404 handler
app.use((req, res, next) => {
  res.status(404).json({ message: 'Endpoint not found' });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
});

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = { app, server };
