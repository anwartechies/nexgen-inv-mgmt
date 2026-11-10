const { Op } = require('sequelize');
const { Visit, PickItem, Medicine, Batch, User, Patient, StockEntry } = require('../models');
const { dayRange, todayStr, addDays } = require('./dates');

const IST = { timeZone: 'Asia/Kolkata', hour: 'numeric', minute: '2-digit' };
const time = (d) => new Date(d).toLocaleTimeString('en-IN', IST).toLowerCase();

async function stockStatus() {
  const today = todayStr();
  const meds = await Medicine.findAll({ where: { active: true }, include: [Batch] });
  const left = {};
  let lowStock = 0;
  for (const m of meds) {
    const q = m.Batches.filter((b) => b.status === 'active' && b.expiry >= today).reduce((s, b) => s + b.qty, 0);
    left[m.id] = q;
    if (q <= m.alertBelow) lowStock++;
  }
  const live = { status: 'active', qty: { [Op.gt]: 0 } };
  const expired = await Batch.count({ where: { ...live, expiry: { [Op.lt]: today } } });
  const in30 = await Batch.count({ where: { ...live, expiry: { [Op.gte]: today, [Op.lte]: addDays(today, 30) } } });
  return { left, lowStock, expired, in30, meds };
}

async function eod(date) {
  const { start, end, date: d } = dayRange(date);
  const visits = await Visit.findAll({
    where: { createdAt: { [Op.gte]: start, [Op.lt]: end } },
    include: [{ model: User, attributes: ['id', 'name'] }, Patient, { model: PickItem, as: 'items', include: [Medicine, Batch] }],
    order: [['createdAt', 'ASC']],
  });
  const st = await stockStatus();

  let itemsIssued = 0, soldValue = 0;
  const emp = new Map();
  const med = new Map();
  for (const v of visits) {
    const e = emp.get(v.UserId) || { userId: v.UserId, name: v.User?.name, visits: 0, items: 0, value: 0, visitTimes: [], lines: [] };
    e.visits++; e.visitTimes.push(time(v.createdAt));
    for (const it of v.items) {
      const val = it.qty * Number(it.unitPrice || 0);
      itemsIssued += it.qty; soldValue += val;
      e.items += it.qty; e.value += val;
      e.lines.push({ medicine: it.Medicine.name, batchNo: it.Batch?.batchNo, patient: v.Patient?.code, patientName: v.Patient?.name, qty: it.qty, time: time(v.createdAt) });
      const m = med.get(it.MedicineId) || { medicineId: it.MedicineId, name: it.Medicine.name, issued: 0, value: 0, left: st.left[it.MedicineId] ?? 0, low: false };
      m.issued += it.qty; m.value += val;
      m.low = m.left <= it.Medicine.alertBelow;
      med.set(it.MedicineId, m);
    }
    emp.set(v.UserId, e);
  }
  const added = await StockEntry.findAll({
    where: { createdAt: { [Op.gte]: start, [Op.lt]: end }, type: 'add' },
    include: [{ model: User, attributes: ['id', 'name'] }, { model: Batch, include: [Medicine] }],
    order: [['createdAt', 'ASC']],
  });
  return {
    date: d,
    itemsIssued,
    soldValue: Math.round(soldValue * 100) / 100,
    staffVisits: visits.length,
    staffCount: emp.size,
    lowStock: st.lowStock,
    expiredBatches: st.expired,
    expiring30: st.in30,
    byEmployee: [...emp.values()].sort((a, b) => b.items - a.items),
    byMedicine: [...med.values()].sort((a, b) => b.issued - a.issued),
    stockAdded: added.map((s) => ({
      user: s.User?.name, medicine: s.Batch?.Medicine?.name, batchNo: s.Batch?.batchNo, qty: s.qty, time: time(s.createdAt),
    })),
  };
}

async function expiry(window = '30') {
  const today = todayStr();
  const live = { status: 'active', qty: { [Op.gt]: 0 } };
  const ranges = {
    expired: { [Op.lt]: today },
    30: { [Op.gte]: today, [Op.lte]: addDays(today, 30) },
    90: { [Op.gte]: today, [Op.lte]: addDays(today, 90) },
  };
  const counts = {};
  for (const k of Object.keys(ranges)) counts[k] = await Batch.count({ where: { ...live, expiry: ranges[k] } });
  const batches = await Batch.findAll({
    where: { ...live, expiry: ranges[window] || ranges[30] }, include: [Medicine], order: [['expiry', 'ASC']],
  });
  const t0 = new Date(today + 'T00:00:00Z');
  return {
    counts,
    batches: batches.map((b) => ({
      ...b.toJSON(),
      daysLeft: Math.round((new Date(b.expiry + 'T00:00:00Z') - t0) / 864e5),
    })),
  };
}

module.exports = { eod, expiry, stockStatus };
