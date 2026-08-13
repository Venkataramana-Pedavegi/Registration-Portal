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
    let host = process.env.DB_HOST || process.env.MYSQLHOST || process.env.MYSQL_HOST;
    let port = process.env.DB_PORT || process.env.MYSQLPORT || process.env.MYSQL_PORT;
    let dbName = process.env.DB_NAME || process.env.MYSQLDATABASE || process.env.MYSQL_DATABASE;
    let user = process.env.DB_USER || process.env.MYSQLUSER || process.env.MYSQL_USER;
    let password = process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : (process.env.MYSQLPASSWORD || process.env.MYSQL_PASSWORD);

    const connectionUrl = process.env.MYSQL_URL || process.env.DATABASE_URL;
    if (connectionUrl && (!host || !user)) {
      try {
        const parsed = new URL(connectionUrl);
        host = host || parsed.hostname;
        port = port || parsed.port;
        dbName = dbName || (parsed.pathname ? parsed.pathname.replace(/^\//, '') : undefined);
        user = user || parsed.username;
        if (password === undefined && parsed.password) {
          password = parsed.password;
        }
      } catch (e) {
        // Ignore URL parse error
      }
    }

    host = host || '127.0.0.1';
    port = port ? parseInt(port, 10) : 3306;
    user = user || 'root';
    password = password !== undefined ? password : '';
    dbName = dbName || 'college_event_registration';

    const connection = await mysql.createConnection({
      host,
      port,
      user,
      password,
    });

    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\`;`);
    await connection.end();
    console.log(`Database '${dbName}' verified/created successfully.`);
  } catch (error) {
    console.error('Failed to initialize database:', error.message);
    // Do not crash the process immediately, let Sequelize attempt fallback
  }
};

module.exports = initializeDatabase;

