// Patients + employee pickups (visits). Stock is deducted FEFO: "use first" batches,
// then the batch that expires soonest. Expired batches are never issued.
const router = require('express').Router();
const { Op } = require('sequelize');
const { sequelize, Patient, Visit, PickItem, Batch, Medicine, User } = require('../models');
const { wrap, HttpError } = require('../middleware/errors');
const { todayStr, dayRange } = require('../services/dates');

const FEFO = [['useFirst', 'DESC'], ['expiry', 'ASC'], ['id', 'ASC']];
const usableWhere = (medicineId) => ({
  MedicineId: medicineId, status: 'active', qty: { [Op.gt]: 0 }, expiry: { [Op.gte]: todayStr() },
});

router.get('/patients', wrap(async (req, res) => {
  const q = (req.query.q || '').trim();
  const where = q ? { [Op.or]: [
    { name: { [Op.iLike]: `%${q}%` } }, { code: { [Op.iLike]: `%${q}%` } }, { phone: { [Op.iLike]: `%${q}%` } },
  ] } : {};
  res.json(await Patient.findAll({ where, order: [['updatedAt', 'DESC']], limit: 20 }));
}));

router.post('/patients', wrap(async (req, res) => {
  const { name, phone } = req.body;
  let { code } = req.body;
  if (!name) throw new HttpError(400, 'Patient name required');
  if (!code) {
    const last = await Patient.max('id');
    code = `PT-${String((last || 0) + 1001).padStart(4, '0')}`;
  }
  res.status(201).json(await Patient.create({ name: name.trim(), phone, code: code.trim() }));
}));

// Which batch will the app pick for this medicine?
router.get('/picks/suggest/:medicineId', wrap(async (req, res) => {
  const batches = await Batch.findAll({ where: usableWhere(req.params.medicineId), order: FEFO });
  res.json({ batches, total: batches.reduce((s, b) => s + b.qty, 0) });
}));

router.post('/visits', wrap(async (req, res) => {
  const { patientId, items, note } = req.body;
  if (!patientId) throw new HttpError(400, 'Choose a patient');
  if (!Array.isArray(items) || !items.length) throw new HttpError(400, 'Add at least one medicine');

  const visit = await sequelize.transaction(async (t) => {
    const patient = await Patient.findByPk(patientId, { transaction: t });
    if (!patient) throw new HttpError(400, 'Patient not found');
    const v = await Visit.create({ UserId: req.user.id, PatientId: patient.id, note }, { transaction: t });
    for (const it of items) {
      let need = Number(it.qty);
      if (!Number.isInteger(need) || need <= 0) throw new HttpError(400, 'Quantity must be a positive number');
      const med = await Medicine.findByPk(it.medicineId, { transaction: t });
      if (!med) throw new HttpError(400, 'Medicine not found');
      const batches = await Batch.findAll({ where: usableWhere(med.id), order: FEFO, transaction: t, lock: t.LOCK.UPDATE });
      const available = batches.reduce((s, b) => s + b.qty, 0);
      if (available < need) throw new HttpError(409, `Only ${available} ${med.unit.toLowerCase()} of ${med.name} in stock`);
      for (const b of batches) {
        if (!need) break;
        const take = Math.min(need, b.qty);
        b.qty -= take;
        await b.save({ transaction: t });
        await PickItem.create({
          VisitId: v.id, BatchId: b.id, MedicineId: med.id, qty: take, unitPrice: b.price ?? med.price,
        }, { transaction: t });
        need -= take;
      }
    }
    patient.changed('updatedAt', true);
    await patient.save({ transaction: t });
    return v;
  });
  res.status(201).json(await loadVisit(visit.id));
}));

const visitInclude = [
  { model: User, attributes: ['id', 'name', 'role'] },
  Patient,
  { model: PickItem, as: 'items', include: [Medicine, { model: Batch, attributes: ['id', 'batchNo', 'expiry'] }] },
];
const loadVisit = (id) => Visit.findByPk(id, { include: visitInclude });

router.get('/visits', wrap(async (req, res) => {
  const where = {};
  if (req.user.role === 'employee' || req.query.mine) where.UserId = req.user.id;
  else if (req.query.userId) where.UserId = req.query.userId;
  if (req.query.date) {
    const { start, end } = dayRange(req.query.date);
    where.createdAt = { [Op.gte]: start, [Op.lt]: end };
  } else if (req.query.from || req.query.to) {
    where.createdAt = {};
    if (req.query.from) where.createdAt[Op.gte] = dayRange(req.query.from).start;
    if (req.query.to) where.createdAt[Op.lt] = dayRange(req.query.to).end;
  }
  if (req.query.patientId) where.PatientId = req.query.patientId;
  res.json(await Visit.findAll({
    where, include: visitInclude, order: [['createdAt', 'DESC']], limit: Math.min(Number(req.query.limit || 100), 500),
  }));
}));

module.exports = router;
