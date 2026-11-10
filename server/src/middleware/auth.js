const jwt = require('jsonwebtoken');
const env = require('../config/env');
const { User } = require('../models');

async function auth(req, res, next) {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Not logged in' });
  try {
    const payload = jwt.verify(token, env.jwtSecret);
    const user = await User.findByPk(payload.sub);
    if (!user || !user.active) return res.status(401).json({ error: 'Account disabled' });
    req.user = user;
    next();
  } catch {
    res.status(401).json({ error: 'Session expired' });
  }
}

const allow = (...roles) => (req, res, next) =>
  roles.includes(req.user.role) ? next() : res.status(403).json({ error: 'Not allowed for your role' });

module.exports = { auth, allow };
