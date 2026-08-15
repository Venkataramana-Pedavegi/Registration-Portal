const mysql = require('mysql2/promise');
require('dotenv').config();

if (process.env.NODE_ENV === 'test') {
  process.env.DB_NAME = 'college_event_registration_test';
}

const isRemoteHost = (host) => {
  if (!host) return false;
  return host !== '127.0.0.1' && host !== 'localhost' && host !== '::1';
};

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

    const sslDisabled = process.env.DB_SSL === 'false' || process.env.MYSQL_SSL === 'false';
    const sslExplicitlyEnabled = process.env.DB_SSL === 'true' || process.env.MYSQL_SSL === 'true';
    const isCloudEnv =
      process.env.NODE_ENV === 'production' ||
      isRemoteHost(host) ||
      (connectionUrl &&
        (connectionUrl.includes('ssl') ||
         connectionUrl.includes('aiven') ||
         connectionUrl.includes('railway') ||
         connectionUrl.includes('planetscale')));

    const sslConfig = (!sslDisabled && (sslExplicitlyEnabled || isCloudEnv))
      ? { rejectUnauthorized: false }
      : undefined;

    const connectionConfig = {
      host,
      port,
      user,
      password,
    };
    if (sslConfig) {
      connectionConfig.ssl = sslConfig;
    }

    let connection;
    try {
      connection = await mysql.createConnection(connectionConfig);
      await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\`;`);
      await connection.end();
      console.log(`Database '${dbName}' verified/created successfully.`);
    } catch (createErr) {
      if (connection) {
        try { await connection.end(); } catch (e) {}
      }
      console.log(`[initDb] Notice: Pre-connection database check skipped (${createErr.message}). Proceeding with direct database connection.`);
    }
  } catch (error) {
    console.error('Failed to initialize database:', error.message);
  }
};

module.exports = initializeDatabase;


