require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

module.exports = {
  port: Number(process.env.PORT || 4000),
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 5432),
    name: process.env.DB_NAME || 'nexgen_inventory',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
  },
  jwtSecret: process.env.JWT_SECRET || 'dev-access',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'dev-refresh',
  corsOrigin: process.env.CORS_ORIGIN || '*',
  timezone: process.env.TZ_OFFSET || '+05:30',
};
