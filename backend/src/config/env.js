require('dotenv').config();

function parseCorsOrigins(rawValue) {
  if (!rawValue) {
    return ['http://localhost:3000', 'http://127.0.0.1:3000'];
  }

  return rawValue
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean);
}

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 8000),
  corsOrigins: parseCorsOrigins(process.env.CORS_ORIGINS),
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-key-change-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '3600',
  dbHost: process.env.DB_HOST || 'localhost',
  dbPort: Number(process.env.DB_PORT || 3306),
  dbName: process.env.DB_NAME || 'motomec17gb_frota',
  dbUser: process.env.DB_USER || 'root',
  dbPassword: process.env.DB_PASSWORD || '',
};

module.exports = { env };

