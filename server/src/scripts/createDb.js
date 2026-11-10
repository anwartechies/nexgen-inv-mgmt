const { Client } = require('pg');
const env = require('../config/env');

(async () => {
  const c = new Client({ host: env.db.host, port: env.db.port, user: env.db.user, password: env.db.password, database: 'postgres' });
  await c.connect();
  const { rowCount } = await c.query('SELECT 1 FROM pg_database WHERE datname = $1', [env.db.name]);
  if (rowCount) console.log(`Database "${env.db.name}" already exists`);
  else { await c.query(`CREATE DATABASE "${env.db.name.replace(/"/g, '')}"`); console.log(`Created database "${env.db.name}"`); }
  await c.end();
})().catch((e) => { console.error(e.message); process.exit(1); });
