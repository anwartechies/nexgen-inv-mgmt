// Categories, medicines, batches, stock-in.
const router = require('express').Router();
const { Op } = require('sequelize');
const { sequelize, Category, Medicine, Batch, StockEntry, User } = require('../models');
const { allow } = require('../middleware/auth');
const { wrap, HttpError } = require('../middleware/errors');
const { todayStr, addDays } = require('../services/dates');

const staff = allow('super_admin', 'manager');

router.get('/categories', wrap(async (req, res) => res.json(await Category.findAll({ order: [['name', 'ASC']] }))));
router.post('/categories', staff, wrap(async (req, res) => {
  if (!req.body.name) throw new HttpError(400, 'Name required');
  res.status(201).json(await Category.create({ name: req.body.name.trim() }));
}));

function summarize(m) {
  const today = todayStr();
  const soon = addDays(today, 30);
  const json = m.toJSON();
  const all = (json.Batches || []).sort((a, b) => (a.expiry < b.expiry ? -1 : 1));
  const live = all.filter((b) => b.status === 'active' && b.qty > 0);
  const usable = live.filter((b) => b.expiry >= today);
  const qty = usable.reduce((s, b) => s + b.qty, 0);
  const expiring = usable.filter((b) => b.expiry <= soon);
  return {
    ...json,
    Batches: all,
    stock: qty,
    batchCount: usable.length,
    lowStock: qty <= m.alertBelow,
    expiringCount: expiring.length,
    nextExpiry: expiring[0]?.expiry || null,
    expiredCount: live.filter((b) => b.expiry < today).length,
  };
}

router.get('/medicines', wrap(async (req, res) => {
  const where = { active: true };
  const q = (req.query.q || '').trim();
  if (q) {
    const batchHits = await Batch.findAll({ attributes: ['MedicineId'], where: { batchNo: { [Op.iLike]: `%${q}%` } } });
    where[Op.or] = [{ name: { [Op.iLike]: `%${q}%` } }, { id: batchHits.map((b) => b.MedicineId) }];
  }
  if (req.query.categoryId) where.CategoryId = req.query.categoryId;
  const meds = await Medicine.findAll({ where, include: [Category, Batch], order: [['name', 'ASC']] });
  let list = meds.map(summarize);
  if (req.query.filter === 'low') list = list.filter((m) => m.lowStock);
  if (req.query.filter === 'expiring') list = list.filter((m) => m.expiringCount > 0 || m.expiredCount > 0);
  res.json(list);
}));

router.get('/medicines/:id', wrap(async (req, res) => {
  const m = await Medicine.findByPk(req.params.id, { include: [Category, Batch] });
  if (!m) throw new HttpError(404, 'Medicine not found');
  res.json(summarize(m));
}));

router.post('/medicines', staff, wrap(async (req, res) => {
  const { name, CategoryId, unit, pack, price, alertBelow } = req.body;
  if (!name) throw new HttpError(400, 'Name required');
  res.status(201).json(await Medicine.create({ name: name.trim(), CategoryId, unit, pack, price, alertBelow }));
}));

router.patch('/medicines/:id', staff, wrap(async (req, res) => {
  const m = await Medicine.findByPk(req.params.id);
  if (!m) throw new HttpError(404, 'Medicine not found');
  ['name', 'CategoryId', 'unit', 'pack', 'price', 'alertBelow', 'active'].forEach((f) => {
    if (req.body[f] !== undefined) m[f] = req.body[f];
  });
  await m.save();
  res.json(m);
}));

const blank = (v) => v === undefined || v === null || v === '';

// Add stock: find-or-create medicine & batch, increase qty, log StockEntry.
router.post('/stock', staff, wrap(async (req, res) => {
  const { medicineId, medicineName, categoryId, categoryName, unit, price, alertBelow, batchNo, expiry, qty, note } = req.body;
  const n = Number(qty);
  if (!batchNo || !expiry || !Number.isInteger(n) || n <= 0) throw new HttpError(400, 'Batch, expiry and a positive quantity are required');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(expiry)) throw new HttpError(400, 'Expiry must be a date');
  const result = await sequelize.transaction(async (t) => {
    let catId = categoryId || null;
    if (!catId && categoryName) {
      const [c] = await Category.findOrCreate({ where: { name: categoryName.trim() }, transaction: t });
      catId = c.id;
    }
    let med = medicineId ? await Medicine.findByPk(medicineId, { transaction: t }) : null;
    if (!med && medicineName) {
      med = await Medicine.findOne({ where: { name: { [Op.iLike]: medicineName.trim() } }, transaction: t });
      if (!med) {
        med = await Medicine.create({
          name: medicineName.trim(), CategoryId: catId, unit: unit || 'Unit',
          price: blank(price) ? 0 : price, alertBelow: blank(alertBelow) ? 10 : alertBelow,
        }, { transaction: t });
      }
    }
    if (!med) throw new HttpError(400, 'Choose or type a medicine');
    const upd = {};
    if (catId) upd.CategoryId = catId;
    if (unit) upd.unit = unit;
    if (!blank(price)) upd.price = price;
    if (!blank(alertBelow)) upd.alertBelow = alertBelow;
    await med.update(upd, { transaction: t });

    let batch = await Batch.findOne({ where: { MedicineId: med.id, batchNo: batchNo.trim() }, transaction: t, lock: t.LOCK.UPDATE });
    if (batch) {
      if (batch.expiry !== expiry) throw new HttpError(400, `Batch ${batchNo} already exists with expiry ${batch.expiry}`);
      batch.qty += n;
      batch.status = 'active';
      await batch.save({ transaction: t });
    } else {
      batch = await Batch.create({ MedicineId: med.id, batchNo: batchNo.trim(), expiry, qty: n, price: blank(price) ? null : price }, { transaction: t });
    }
    await StockEntry.create({ type: 'add', qty: n, note, BatchId: batch.id, UserId: req.user.id }, { transaction: t });
    return { medicine: med, batch };
  });
  res.status(201).json(result);
}));

router.get('/stock-entries', staff, wrap(async (req, res) => {
  res.json(await StockEntry.findAll({
    include: [{ model: User, attributes: ['id', 'name'] }, { model: Batch, include: [Medicine] }],
    order: [['createdAt', 'DESC']], limit: Math.min(Number(req.query.limit || 100), 500),
  }));
}));

// Batch actions: use-first toggle, note, return/dispose, count correction.
router.patch('/batches/:id', staff, wrap(async (req, res) => {
  const b = await Batch.findByPk(req.params.id);
  if (!b) throw new HttpError(404, 'Batch not found');
  const { useFirst, note, status, adjustQty } = req.body;
  await sequelize.transaction(async (t) => {
    if (useFirst !== undefined) b.useFirst = !!useFirst;
    if (note !== undefined) b.note = note;
    if (status && ['returned', 'disposed'].includes(status) && b.status === 'active') {
      if (b.qty > 0) {
        await StockEntry.create({ type: status === 'returned' ? 'return' : 'dispose', qty: -b.qty, note, BatchId: b.id, UserId: req.user.id }, { transaction: t });
      }
      b.status = status; b.qty = 0; b.useFirst = false;
    }
    if (adjustQty !== undefined) {
      const q = Number(adjustQty);
      if (!Number.isInteger(q) || q < 0) throw new HttpError(400, 'Quantity must be 0 or more');
      if (q !== b.qty) {
        await StockEntry.create({ type: 'adjust', qty: q - b.qty, note: note || 'Stock count correction', BatchId: b.id, UserId: req.user.id }, { transaction: t });
      }
      b.qty = q;
    }
    await b.save({ transaction: t });
  });
  res.json(b);
}));

module.exports = router;
