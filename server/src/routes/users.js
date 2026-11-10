const router = require('express').Router();
const bcrypt = require('bcryptjs');
const { User, ROLES } = require('../models');
const { allow } = require('../middleware/auth');
const { wrap, HttpError } = require('../middleware/errors');
const { clean } = require('./auth');

router.use(allow('super_admin'));

router.get('/', wrap(async (req, res) => {
  res.json(await User.findAll({ order: [['role', 'ASC'], ['name', 'ASC']] }));
}));

router.post('/', wrap(async (req, res) => {
  const { name, role = 'employee', pin } = req.body;
  const mobile = clean(req.body.mobile);
  if (!name || mobile.length !== 10) throw new HttpError(400, 'Name and 10-digit mobile are required');
  if (!ROLES.includes(role)) throw new HttpError(400, 'Invalid role');
  if (!/^\d{4}$/.test(String(pin))) throw new HttpError(400, 'PIN must be 4 digits');
  const u = await User.create({ name, mobile, role, pinHash: await bcrypt.hash(String(pin), 10) });
  res.status(201).json(await User.findByPk(u.id));
}));

router.patch('/:id', wrap(async (req, res) => {
  const u = await User.findByPk(req.params.id);
  if (!u) throw new HttpError(404, 'User not found');
  const { name, role, active, pin } = req.body;
  if (name !== undefined) u.name = name;
  if (req.body.mobile !== undefined) u.mobile = clean(req.body.mobile);
  if (role !== undefined) {
    if (!ROLES.includes(role)) throw new HttpError(400, 'Invalid role');
    if (u.id === req.user.id && role !== 'super_admin') throw new HttpError(400, 'You cannot change your own role');
    u.role = role;
  }
  if (active !== undefined) {
    if (u.id === req.user.id && !active) throw new HttpError(400, 'You cannot disable yourself');
    u.active = !!active;
  }
  if (pin !== undefined && pin !== '') {
    if (!/^\d{4}$/.test(String(pin))) throw new HttpError(400, 'PIN must be 4 digits');
    u.pinHash = await bcrypt.hash(String(pin), 10);
  }
  await u.save();
  res.json(await User.findByPk(u.id));
}));

module.exports = router;
