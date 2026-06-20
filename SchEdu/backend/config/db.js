const { Sequelize } = require('sequelize');
const path = require('path');
// Always load backend .env regardless of CWD
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// Support multiple dialects with sensible dev fallback
const DIALECT = (process.env.DB_DIALECT || 'postgres').toLowerCase();

let sequelize;
if (DIALECT === 'postgres' || DIALECT === 'postgresql') {
  sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 5432,
      dialect: 'postgres',
      logging: false,
    }
  );
} else {
  // Dev-friendly fallback to SQLite to let the app boot without a local Postgres
  const storagePath = process.env.SQLITE_STORAGE || path.resolve(__dirname, '../dev.sqlite3');
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: storagePath,
    logging: false,
  });
}

module.exports = sequelize;
