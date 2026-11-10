const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const env = require('./config/env');
const { sequelize } = require('./models');
const { auth } = require('./middleware/auth');
const { errorHandler } = require('./middleware/errors');

const app = express();
app.use(helmet());
app.use(cors({ origin: env.corsOrigin === '*' ? true : env.corsOrigin.split(','), credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));

app.get('/api/health', (req, res) => res.json({ ok: true }));
app.use('/api/auth', require('./routes/auth').router);
app.use('/api/users', auth, require('./routes/users'));
app.use('/api/reports', auth, require('./routes/reports'));
app.use('/api', auth, require('./routes/catalog'));
app.use('/api', auth, require('./routes/picks'));
app.use('/api', (req, res) => res.status(404).json({ error: 'Not found' }));
app.use(errorHandler);

(async () => {
  await sequelize.authenticate();
  await sequelize.sync({ alter: process.env.DB_ALTER === '1' });
  app.listen(env.port, '0.0.0.0', () => console.log(`API ready on http://localhost:${env.port}/api`));
})().catch((e) => {
  console.error('Failed to start:', e.message);
  console.error('Tip: run "npm run db:create" and check DB_* values in server/.env');
  process.exit(1);
});
