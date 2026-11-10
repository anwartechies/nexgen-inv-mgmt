// Resets the database and loads demo data. Run: npm run seed
const bcrypt = require('bcryptjs');
const { sequelize, User, Category, Medicine, Batch, Patient, Visit, PickItem, StockEntry } = require('../models');
const { todayStr, addDays } = require('../services/dates');

(async () => {
  await sequelize.sync({ force: true });
  const pin = await bcrypt.hash('1234', 10);
  const [admin, mgr, ravi, pooja, amit] = await User.bulkCreate([
    { name: 'Dr. Admin', mobile: '9000000001', role: 'super_admin', pinHash: pin },
    { name: 'Priya', mobile: '9000000002', role: 'manager', pinHash: pin },
    { name: 'Ravi K.', mobile: '9000000003', role: 'employee', pinHash: pin },
    { name: 'Pooja M.', mobile: '9000000004', role: 'employee', pinHash: pin },
    { name: 'Amit S.', mobile: '9000000005', role: 'employee', pinHash: pin },
  ]);
  const cats = {};
  for (const n of ['Injections', 'Tablets', 'Topicals', 'Surgical']) cats[n] = await Category.create({ name: n });

  const t = todayStr();
  const meds = [
    ['Ceftriaxone 1g inj', 'Injections', 'Vial', 85, 10, [['C-2391', addDays(t, 24), 46], ['C-2455', addDays(t, 600), 0]]],
    ['Lignocaine 2% 30 ml', 'Injections', 'Vial', 40, 10, [['L-882', addDays(t, 19), 12]]],
    ['Finasteride 1 mg', 'Tablets', 'Strip', 120, 10, [['F-310', addDays(t, 300), 8]]],
    ['Minoxidil 5% solution', 'Topicals', 'Bottle', 650, 5, [['MX-77', addDays(t, 400), 34]]],
    ['PRP kit', 'Surgical', 'Kit', 1800, 5, [['PRP-12', addDays(t, 200), 20]]],
    ['Pantoprazole 40 mg', 'Tablets', 'Strip', 95, 10, [['PN-501', addDays(t, 75), 52]]],
    ['Biotin 10 mg', 'Tablets', 'Strip', 150, 5, [['BT-117', addDays(t, 29), 6]]],
    ['Amoxicillin 500 mg', 'Tablets', 'Strip', 70, 10, [['AX-09', addDays(t, -3), 4], ['AX-14', addDays(t, 180), 30]]],
  ];
  const byName = {};
  for (const [name, cat, unit, price, alertBelow, batches] of meds) {
    const m = await Medicine.create({ name, CategoryId: cats[cat].id, unit, price, alertBelow });
    byName[name] = m;
    for (const [batchNo, expiry, qty] of batches) {
      const b = await Batch.create({ MedicineId: m.id, batchNo, expiry, qty: qty || 50 });
      await StockEntry.create({ type: 'add', qty: qty || 50, BatchId: b.id, UserId: mgr.id, createdAt: new Date(Date.now() - 20 * 864e5) });
    }
  }
  const pts = await Patient.bulkCreate([
    { code: 'PT-0987', name: 'Sunil P.', phone: '9811111111' },
    { code: 'PT-1042', name: 'Rahul S.', phone: '9822222222' },
    { code: 'PT-1050', name: 'Meena R.', phone: '9833333333' },
  ]);

  async function pick(user, patient, medName, qty) {
    const m = byName[medName];
    const b = await Batch.findOne({ where: { MedicineId: m.id }, order: [['expiry', 'ASC']] });
    const usable = b.expiry < t ? await Batch.findOne({ where: { MedicineId: m.id, batchNo: 'AX-14' } }) : b;
    usable.qty -= qty; await usable.save();
    const v = await Visit.create({ UserId: user.id, PatientId: patient.id });
    await PickItem.create({ VisitId: v.id, BatchId: usable.id, MedicineId: m.id, qty, unitPrice: m.price });
  }
  await pick(ravi, pts[0], 'Minoxidil 5% solution', 1);
  await pick(ravi, pts[1], 'Lignocaine 2% 30 ml', 3);
  await pick(pooja, pts[2], 'Pantoprazole 40 mg', 2);
  await pick(amit, pts[1], 'Ceftriaxone 1g inj', 2);

  console.log('Seeded. Log in with PIN 1234:');
  console.log('  Super Admin 9000000001 · Manager 9000000002 · Employees 9000000003/4/5');
  await sequelize.close();
})().catch((e) => { console.error(e); process.exit(1); });
