const mysql = require('mysql2/promise');
require('dotenv').config();

if (process.env.NODE_ENV === 'test') {
  process.env.DB_NAME = 'college_event_registration_test';
}

/**
 * Initializes the MySQL database by creating it if it doesn't already exist.
 */
const initializeDatabase = async () => {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || '127.0.0.1',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
    });

    const dbName = process.env.DB_NAME || 'college_event_registration';
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\`;`);
    await connection.end();
    console.log(`Database '${dbName}' verified/created successfully.`);
  } catch (error) {
    console.error('Failed to initialize database:', error.message);
    // Do not crash the process immediately, let Sequelize attempt fallback
  }
};

module.exports = initializeDatabase;
