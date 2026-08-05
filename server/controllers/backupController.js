const fs = require('fs');
const path = require('path');
const { sequelize } = require('../models');
const { logAudit } = require('../middleware/auditLogger');

const BACKUP_DIR = path.join(__dirname, '..', 'backups');

// Ensure backups directory exists
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// Generate full database backup data
const generateBackupData = async () => {
  const models = require('../models');
  
  const tables = {
    SystemSetting: await models.SystemSetting.findAll(),
    Admin: await models.Admin.findAll(),
    Student: await models.Student.findAll(),
    Event: await models.Event.findAll(),
    Registration: await models.Registration.findAll(),
    Attendance: await models.Attendance.findAll(),
    Volunteer: await models.Volunteer.findAll(),
    VolunteerTask: await models.VolunteerTask.findAll(),
    Certificate: await models.Certificate.findAll(),
    Notification: await models.Notification.findAll(),
    AuditLog: await models.AuditLog.findAll(),
    EventGallery: await models.EventGallery.findAll(),
    Leaderboard: await models.Leaderboard.findAll(),
    Badge: await models.Badge.findAll(),
    StudentBadge: await models.StudentBadge.findAll(),
    ActivityLog: await models.ActivityLog.findAll(),
  };

  return {
    backupDate: new Date(),
    version: '1.0.0',
    data: tables,
  };
};

// Create a backup file manually
const createManualBackup = async (req, res) => {
  try {
    const backupData = await generateBackupData();
    const fileName = `backup_manual_${Date.now()}.json`;
    const filePath = path.join(BACKUP_DIR, fileName);

    fs.writeFileSync(filePath, JSON.stringify(backupData, null, 2));

    await logAudit({ req, userId: req.user.id, userRole: req.role || 'Admin', action: 'DB_BACKUP_CREATE', details: `Created manual backup file: ${fileName}` });

    res.status(201).json({
      message: 'Backup created successfully',
      fileName,
      size: fs.statSync(filePath).size,
      createdAt: backupData.backupDate,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error creating database backup', error: error.message });
  }
};

// List backup history
const getBackupHistory = async (req, res) => {
  try {
    const files = fs.readdirSync(BACKUP_DIR);
    const history = files
      .filter((file) => file.endsWith('.json'))
      .map((file) => {
        const filePath = path.join(BACKUP_DIR, file);
        const stats = fs.statSync(filePath);
        return {
          fileName: file,
          size: stats.size,
          createdAt: stats.mtime,
        };
      })
      .sort((a, b) => b.createdAt - a.createdAt); // Newest first

    res.json(history);
  } catch (error) {
    res.status(500).json({ message: 'Server error retrieving backup history', error: error.message });
  }
};

// Download backup file
const downloadBackup = async (req, res) => {
  try {
    const { fileName } = req.params;
    const filePath = path.join(BACKUP_DIR, fileName);

    // Security check to avoid path traversal
    if (!fileName.endsWith('.json') || path.dirname(filePath) !== BACKUP_DIR || !fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'Backup file not found' });
    }

    await logAudit({ req, userId: req.user.id, userRole: req.role || 'Admin', action: 'DB_BACKUP_DOWNLOAD', details: `Downloaded backup file: ${fileName}` });

    res.download(filePath);
  } catch (error) {
    res.status(500).json({ message: 'Server error downloading backup', error: error.message });
  }
};

// Restore database from uploaded JSON or historical file
const restoreBackup = async (req, res) => {
  let restoreData;

  try {
    // If request contains uploaded file, use it. Otherwise look for filename param
    if (req.file) {
      restoreData = JSON.parse(req.file.buffer.toString());
    } else if (req.body.fileName) {
      const filePath = path.join(BACKUP_DIR, req.body.fileName);
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: 'Backup file not found' });
      }
      restoreData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } else {
      return res.status(400).json({ message: 'No backup file provided for restoration' });
    }

    if (!restoreData || !restoreData.data) {
      return res.status(400).json({ message: 'Invalid backup file structure' });
    }

    const backupContent = restoreData.data;
    const models = require('../models');

    // Restore table records using transaction & foreign key checks disable
    await sequelize.transaction(async (t) => {
      await sequelize.query('SET FOREIGN_KEY_CHECKS = 0', { transaction: t });

      const modelNames = [
        'SystemSetting',
        'Admin',
        'Student',
        'Event',
        'Registration',
        'Attendance',
        'Volunteer',
        'VolunteerTask',
        'Certificate',
        'Notification',
        'AuditLog',
        'EventGallery',
        'Leaderboard',
        'Badge',
        'StudentBadge',
        'ActivityLog',
      ];

      // Truncate tables
      for (const modelName of modelNames) {
        if (models[modelName]) {
          await models[modelName].destroy({ where: {}, truncate: true, force: true, transaction: t });
        }
      }

      // Re-populate tables
      for (const modelName of modelNames) {
        const rows = backupContent[modelName];
        if (rows && rows.length > 0 && models[modelName]) {
          // Filter out duplicate or null keys if any
          await models[modelName].bulkCreate(rows, { transaction: t, validate: false, ignoreDuplicates: true });
        }
      }

      await sequelize.query('SET FOREIGN_KEY_CHECKS = 1', { transaction: t });
    });

    await logAudit({ req, userId: req.user.id, userRole: req.role || 'Admin', action: 'DB_RESTORE', details: 'Database restore operation executed successfully' });

    res.json({ message: 'Database restored successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error restoring database', error: error.message });
  }
};

// Automatic Backup trigger (called by timer/scheduler)
const runAutoBackup = async () => {
  try {
    const backupData = await generateBackupData();
    const fileName = `backup_auto_${Date.now()}.json`;
    const filePath = path.join(BACKUP_DIR, fileName);

    fs.writeFileSync(filePath, JSON.stringify(backupData, null, 2));
    console.log(`[Auto Backup] Scheduled database backup saved: ${fileName}`);

    // Housekeeping: remove auto backups older than 7 days
    const files = fs.readdirSync(BACKUP_DIR);
    const now = Date.now();
    const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

    files.forEach((file) => {
      if (file.startsWith('backup_auto_') && file.endsWith('.json')) {
        const filePath = path.join(BACKUP_DIR, file);
        const stats = fs.statSync(filePath);
        if (now - stats.mtimeMs > SEVEN_DAYS_MS) {
          fs.unlinkSync(filePath);
          console.log(`[Auto Backup] Cleaned up old backup file: ${file}`);
        }
      }
    });
  } catch (error) {
    console.error('❌ [Auto Backup] Failed to execute automatic backup:', error.message);
  }
};

module.exports = {
  createManualBackup,
  getBackupHistory,
  downloadBackup,
  restoreBackup,
  runAutoBackup,
};
