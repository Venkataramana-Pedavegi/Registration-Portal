const http = require('http');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const { sequelize, Admin } = require('./models');
const { configureHelmet, apiRateLimiter, sanitizeXSS, compression } = require('./middleware/security');
const { initSocket } = require('./utils/socket');

// Load environment variables
dotenv.config();

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
initSocket(server);

// Security & Optimization Middlewares
app.use(compression());
app.use(configureHelmet());
app.use(sanitizeXSS);
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Apply Rate Limiting in production or default environments
if (process.env.NODE_ENV !== 'test') {
  app.use('/api', apiRateLimiter);
}

// Seed Admin User if none exists
const seedAdmin = async () => {
  try {
    const adminCount = await Admin.count();
    if (adminCount === 0) {
      console.log('No admin users found. Seeding default admin...');
      await Admin.create({
        username: 'admin',
        email: 'admin@college.edu',
        password: 'adminpassword',
        role: 'Admin',
      });
      console.log('Default Admin seeded successfully: admin@college.edu / adminpassword');
    }
  } catch (error) {
    console.error('Error seeding admin user:', error.message);
  }
};

const initDb = require('./utils/initDb');

const updateDatabaseSchema = async () => {
  try {
    // Check Events columns
    const [eventColumns] = await sequelize.query("SHOW COLUMNS FROM `Events` LIKE 'registrationType'");
    if (eventColumns.length === 0) {
      console.log('Adding registrationType and price to Events table...');
      await sequelize.query("ALTER TABLE `Events` ADD COLUMN `registrationType` ENUM('FREE', 'PAID') NOT NULL DEFAULT 'FREE'");
      await sequelize.query("ALTER TABLE `Events` ADD COLUMN `price` DECIMAL(10, 2) NOT NULL DEFAULT 0.00");
    }

    const [reminderColumns] = await sequelize.query("SHOW COLUMNS FROM `Events` LIKE 'reminderSent24h'");
    if (reminderColumns.length === 0) {
      console.log('Adding reminder fields to Events table...');
      await sequelize.query("ALTER TABLE `Events` ADD COLUMN `reminderSent24h` TINYINT(1) NOT NULL DEFAULT 0");
      await sequelize.query("ALTER TABLE `Events` ADD COLUMN `reminderSent1h` TINYINT(1) NOT NULL DEFAULT 0");
    }

    // Check Students columns
    const [studentVerifyCols] = await sequelize.query("SHOW COLUMNS FROM `Students` LIKE 'isVerified'");
    if (studentVerifyCols.length === 0) {
      console.log('Adding verification and refresh token columns to Students table...');
      await sequelize.query("ALTER TABLE `Students` ADD COLUMN `isVerified` TINYINT(1) NOT NULL DEFAULT 1");
      await sequelize.query("ALTER TABLE `Students` ADD COLUMN `verificationToken` VARCHAR(255) NULL");
      await sequelize.query("ALTER TABLE `Students` ADD COLUMN `refreshToken` VARCHAR(255) NULL");
    }

    // Check Admins columns
    const [adminTokenCols] = await sequelize.query("SHOW COLUMNS FROM `Admins` LIKE 'refreshToken'");
    if (adminTokenCols.length === 0) {
      console.log('Adding refreshToken to Admins table...');
      await sequelize.query("ALTER TABLE `Admins` ADD COLUMN `refreshToken` VARCHAR(255) NULL");
    }

    // Check Notifications columns
    const [notifCols] = await sequelize.query("SHOW COLUMNS FROM `Notifications` LIKE 'referenceId'");
    if (notifCols.length === 0) {
      console.log('Adding referenceId to Notifications table...');
      await sequelize.query("ALTER TABLE `Notifications` ADD COLUMN `referenceId` INT NULL");
    }

    // Drop Payments table since payments feature is removed
    console.log('Dropping Payments table if it exists...');
    await sequelize.query("SET FOREIGN_KEY_CHECKS = 0");
    await sequelize.query("DROP TABLE IF EXISTS `Payments`");
    await sequelize.query("SET FOREIGN_KEY_CHECKS = 1");

    // Migrate EventGallery schema if needed
    const [tables] = await sequelize.query("SHOW TABLES LIKE 'EventGalleries'");
    if (tables.length > 0) {
      const [galleryCols] = await sequelize.query("SHOW COLUMNS FROM `EventGalleries` LIKE 'isFeatured'");
      if (galleryCols.length === 0) {
        console.log('Migrating EventGalleries table to new schema...');
        await sequelize.query("SET FOREIGN_KEY_CHECKS = 0");
        await sequelize.query("DROP TABLE IF EXISTS `EventGalleries`");
        await sequelize.query("SET FOREIGN_KEY_CHECKS = 1");
      }
    }

    // Check Students security columns
    const [studentCols] = await sequelize.query("SHOW COLUMNS FROM `Students` LIKE 'verificationTokenExpire'");
    if (studentCols.length === 0) {
      console.log('Adding security policy columns to Students table...');
      await sequelize.query("ALTER TABLE `Students` ADD COLUMN `verificationTokenExpire` DATETIME NULL");
      await sequelize.query("ALTER TABLE `Students` ADD COLUMN `otpCode` VARCHAR(255) NULL");
      await sequelize.query("ALTER TABLE `Students` ADD COLUMN `otpExpire` DATETIME NULL");
      await sequelize.query("ALTER TABLE `Students` ADD COLUMN `otpAttempts` INT NOT NULL DEFAULT 0");
      await sequelize.query("ALTER TABLE `Students` ADD COLUMN `passwordHistory` TEXT NULL");
      await sequelize.query("ALTER TABLE `Students` ADD COLUMN `failedLoginAttempts` INT NOT NULL DEFAULT 0");
      await sequelize.query("ALTER TABLE `Students` ADD COLUMN `lockoutUntil` DATETIME NULL");
    }

    // Check Admins security columns
    const [adminCols] = await sequelize.query("SHOW COLUMNS FROM `Admins` LIKE 'otpCode'");
    if (adminCols.length === 0) {
      console.log('Adding security policy columns to Admins table...');
      await sequelize.query("ALTER TABLE `Admins` ADD COLUMN `otpCode` VARCHAR(255) NULL");
      await sequelize.query("ALTER TABLE `Admins` ADD COLUMN `otpExpire` DATETIME NULL");
      await sequelize.query("ALTER TABLE `Admins` ADD COLUMN `otpAttempts` INT NOT NULL DEFAULT 0");
      await sequelize.query("ALTER TABLE `Admins` ADD COLUMN `passwordHistory` TEXT NULL");
      await sequelize.query("ALTER TABLE `Admins` ADD COLUMN `failedLoginAttempts` INT NOT NULL DEFAULT 0");
      await sequelize.query("ALTER TABLE `Admins` ADD COLUMN `lockoutUntil` DATETIME NULL");
    }

    // Check AuditLogs security columns
    const [auditCols] = await sequelize.query("SHOW COLUMNS FROM `AuditLogs` LIKE 'browser'");
    if (auditCols.length === 0) {
      console.log('Adding security policy columns to AuditLogs table...');
      await sequelize.query("ALTER TABLE `AuditLogs` ADD COLUMN `browser` VARCHAR(255) NULL");
      await sequelize.query("ALTER TABLE `AuditLogs` ADD COLUMN `os` VARCHAR(255) NULL");
      await sequelize.query("ALTER TABLE `AuditLogs` ADD COLUMN `resource` VARCHAR(255) NULL");
      await sequelize.query("ALTER TABLE `AuditLogs` ADD COLUMN `status` VARCHAR(255) NULL");
    }

    // Check Students gamification columns
    const [studentRefCheck] = await sequelize.query("SHOW COLUMNS FROM `Students` LIKE 'referralCode'");
    if (studentRefCheck.length === 0) {
      console.log('Adding gamification columns to Students table...');
      await sequelize.query("ALTER TABLE `Students` ADD COLUMN `referralCode` VARCHAR(255) NULL UNIQUE");
      await sequelize.query("ALTER TABLE `Students` ADD COLUMN `referredBy` INT NULL");
    }

    // Check Registrations gamification columns
    const [regWinnerCheck] = await sequelize.query("SHOW COLUMNS FROM `Registrations` LIKE 'isWinner'");
    if (regWinnerCheck.length === 0) {
      console.log('Adding gamification columns to Registrations table...');
      await sequelize.query("ALTER TABLE `Registrations` ADD COLUMN `isWinner` BOOLEAN NOT NULL DEFAULT false");
    }
  } catch (err) {
    console.error('Error during database schema update:', err.message);
  }
};

// Database Connection & Syncing
const startDb = async () => {
  await initDb();
  try {
    await sequelize.authenticate();
    console.log('MySQL Database Connected successfully...');
    await updateDatabaseSchema();
    await sequelize.sync();
    console.log('Database tables synchronized successfully.');
    await seedAdmin();
    // Initialize gamification badges
    const { seedBadges } = require('./services/GamificationService');
    await seedBadges();
    // Initialize background reminders scheduler
    const { initReminderScheduler } = require('./services/reminderService');
    initReminderScheduler();
  } catch (err) {
    console.error('Database connection or synchronization failed:', err.message);
  }
};
startDb();

// Core Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/student', require('./routes/studentRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/profile', require('./routes/profileRoutes'));
app.use('/api/events', require('./routes/eventRoutes'));
app.use('/api/gamification', require('./routes/gamificationRoutes'));
app.use('/api/registrations', require('./routes/registrationRoutes'));
app.use('/api/attendance', require('./routes/attendanceRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/certificates', require('./routes/certificateRoutes'));
app.use('/api/qrcode', require('./routes/qrRoutes'));
app.use('/api/auditlogs', require('./routes/auditRoutes'));
app.use('/api/export', require('./routes/exportRoutes'));

// New Enterprise Feature Routes
app.use('/api/feedback', require('./routes/feedbackRoutes'));
app.use('/api/waitlist', require('./routes/waitlistRoutes'));
app.use('/api/volunteers', require('./routes/volunteerRoutes'));
app.use('/api/ai', require('./routes/aiRoutes'));
app.use('/api/leaderboard', require('./routes/leaderboardRoutes'));
app.use('/api/gallery', require('./routes/galleryRoutes'));

// Root Endpoint
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the College Event Registration API' });
});

// SMTP Email Test Endpoint
const sendEmailService = require('./services/mailService');
app.get('/api/test-email', async (req, res) => {
  const recipient = req.query.to || process.env.EMAIL_USER;
  const result = await sendEmailService(
    recipient,
    'College Event System - SMTP Test Email',
    `
      <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
        <h2 style="color: #2563eb;">✅ SMTP Email Configuration Test</h2>
        <p>Your Nodemailer SMTP email service is configured correctly and working!</p>
        <p><strong>Recipient:</strong> ${recipient}</p>
        <p><strong>Timestamp:</strong> ${new Date().toLocaleString()}</p>
      </div>
    `
  );

  if (result.success) {
    return res.json({
      success: true,
      message: 'Test email sent successfully',
      recipient,
      details: result,
    });
  } else {
    return res.status(500).json({
      success: false,
      message: 'Failed to send test email',
      error: result.error,
    });
  }
});

// Custom 404 handler
app.use((req, res, next) => {
  res.status(404).json({ message: 'Endpoint not found' });
});

// Global Error Handler
const errorHandler = require('./middleware/errorHandler');
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const serverInstance = server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n⚠️  Port ${PORT} is already in use by another running server instance.`);
    console.error(`Backend is already running and accessible at http://localhost:${PORT}\n`);
  } else {
    console.error('Server error:', err);
  }
});

module.exports = { app, server: serverInstance };
