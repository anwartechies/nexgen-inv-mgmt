const router = require('express').Router();
const bcrypt = require('bcryptjs');
const { User } = require('../models');
const { auth } = require('../middleware/auth');
const { wrap, HttpError } = require('../middleware/errors');
const tokens = require('../services/tokens');

const clean = (m) => String(m || '').replace(/\D/g, '').slice(-10);

router.post('/login', wrap(async (req, res) => {
  const mobile = clean(req.body.mobile);
  const pin = String(req.body.pin || '');
  const user = await User.scope('withPin').findOne({ where: { mobile } });
  if (!user || !(await bcrypt.compare(pin, user.pinHash))) throw new HttpError(401, 'Wrong mobile number or PIN');
  if (!user.active) throw new HttpError(403, 'Your account is disabled. Ask the clinic admin.');
  const { pinHash, ...safe } = user.toJSON();
  res.json({ user: safe, ...tokens.issue(user) });
}));

router.post('/refresh', wrap(async (req, res) => {
  let payload;
  try { payload = tokens.verifyRefresh(req.body.refreshToken); } catch { throw new HttpError(401, 'Session expired'); }
  const user = await User.findByPk(payload.sub);
  if (!user || !user.active) throw new HttpError(401, 'Session expired');
  res.json({ user, ...tokens.issue(user) });
}));

router.get('/me', auth, (req, res) => res.json(req.user));

router.post('/change-pin', auth, wrap(async (req, res) => {
  const { oldPin, newPin } = req.body;
  if (!/^\d{4}$/.test(String(newPin))) throw new HttpError(400, 'PIN must be 4 digits');
  const user = await User.scope('withPin').findByPk(req.user.id);
  if (!(await bcrypt.compare(String(oldPin), user.pinHash))) throw new HttpError(400, 'Old PIN is wrong');
  user.pinHash = await bcrypt.hash(String(newPin), 10);
  await user.save();
  res.json({ ok: true });
}));

module.exports = { router, clean };
