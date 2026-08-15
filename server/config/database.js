const { Sequelize } = require('sequelize');
require('dotenv').config();

if (process.env.NODE_ENV === 'test') {
  process.env.DB_NAME = 'college_event_registration_test';
}

const isRemoteHost = (host) => {
  if (!host) return false;
  return host !== '127.0.0.1' && host !== 'localhost' && host !== '::1';
};

const getDbConfig = () => {
  let host = process.env.DB_HOST || process.env.MYSQLHOST || process.env.MYSQL_HOST;
  let port = process.env.DB_PORT || process.env.MYSQLPORT || process.env.MYSQL_PORT;
  let database = process.env.DB_NAME || process.env.MYSQLDATABASE || process.env.MYSQL_DATABASE;
  let user = process.env.DB_USER || process.env.MYSQLUSER || process.env.MYSQL_USER;
  let password = process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : (process.env.MYSQLPASSWORD || process.env.MYSQL_PASSWORD);

  const connectionUrl = process.env.MYSQL_URL || process.env.DATABASE_URL;
  if (connectionUrl && (!host || !user)) {
    try {
      const parsed = new URL(connectionUrl);
      host = host || parsed.hostname;
      port = port || parsed.port;
      database = database || (parsed.pathname ? parsed.pathname.replace(/^\//, '') : undefined);
      user = user || parsed.username;
      if (password === undefined && parsed.password) {
        password = parsed.password;
      }
    } catch (e) {
      // Ignore URL parse error
    }
  }

  return {
    host: host || '127.0.0.1',
    port: port ? parseInt(port, 10) : 3306,
    database: database || 'college_event_registration',
    user: user || 'root',
    password: password !== undefined ? password : '',
    connectionUrl,
  };
};

const dbConfig = getDbConfig();

const sslDisabled = process.env.DB_SSL === 'false' || process.env.MYSQL_SSL === 'false';
const sslExplicitlyEnabled = process.env.DB_SSL === 'true' || process.env.MYSQL_SSL === 'true';
const isCloudEnv =
  process.env.NODE_ENV === 'production' ||
  isRemoteHost(dbConfig.host) ||
  (dbConfig.connectionUrl &&
    (dbConfig.connectionUrl.includes('ssl') ||
     dbConfig.connectionUrl.includes('aiven') ||
     dbConfig.connectionUrl.includes('railway') ||
     dbConfig.connectionUrl.includes('planetscale')));

const shouldEnableSsl = !sslDisabled && (sslExplicitlyEnabled || isCloudEnv);

const options = {
  host: dbConfig.host,
  port: dbConfig.port,
  dialect: 'mysql',
  logging: process.env.NODE_ENV === 'production' ? false : console.log,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
};

if (shouldEnableSsl) {
  options.dialectOptions = {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  };
}

let sequelize;
if (dbConfig.connectionUrl && (dbConfig.connectionUrl.startsWith('mysql://') || dbConfig.connectionUrl.startsWith('mysql2://'))) {
  sequelize = new Sequelize(dbConfig.connectionUrl, options);
} else {
  sequelize = new Sequelize(
    dbConfig.database,
    dbConfig.user,
    dbConfig.password,
    options
  );
}

module.exports = sequelize;


