const { Sequelize } = require('sequelize');
require('dotenv').config();

if (process.env.NODE_ENV === 'test') {
  process.env.DB_NAME = 'college_event_registration_test';
}

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
  };
};

const dbConfig = getDbConfig();

const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.user,
  dbConfig.password,
  {
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
  }
);

module.exports = sequelize;

