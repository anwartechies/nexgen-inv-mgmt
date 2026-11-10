const router = require('express').Router();
const PDFDocument = require('pdfkit');
const { allow } = require('../middleware/auth');
const { wrap } = require('../middleware/errors');
const reports = require('../services/reports');

router.get('/today', allow('super_admin', 'manager'), wrap(async (req, res) => res.json(await reports.eod(req.query.date))));
router.get('/eod', allow('super_admin'), wrap(async (req, res) => res.json(await reports.eod(req.query.date))));
router.get('/expiry', allow('super_admin', 'manager'), wrap(async (req, res) => res.json(await reports.expiry(req.query.window))));

const money = (n) => 'Rs ' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });

router.get('/eod.pdf', allow('super_admin'), wrap(async (req, res) => {
  const r = await reports.eod(req.query.date);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="EOD-${r.date}.pdf"`);
  const doc = new PDFDocument({ margin: 48, size: 'A4' });
  doc.pipe(res);
  doc.fontSize(20).fillColor('#14213D').text('NexGen Inventory — End-of-day report');
  doc.fontSize(11).fillColor('#5A6478').text(r.date).moveDown();
  doc.fillColor('#14213D').fontSize(12)
    .text(`Items issued: ${r.itemsIssued}    Staff: ${r.staffCount}    Visits: ${r.staffVisits}    Sold value: ${money(r.soldValue)}`)
    .text(`Low stock: ${r.lowStock}    Expired batches: ${r.expiredBatches}    Expiring in 30 days: ${r.expiring30}`)
    .moveDown();

  doc.fontSize(14).text('By employee').moveDown(0.3);
  for (const e of r.byEmployee) {
    doc.fontSize(12).fillColor('#14213D').text(`${e.name} — ${e.items} items, ${e.visits} visits`);
    doc.fontSize(9).fillColor('#5A6478').text('Visits: ' + e.visitTimes.join(' · '));
    doc.fillColor('#14213D');
    for (const l of e.lines) doc.fontSize(10).text(`   ${l.time}  ${l.medicine} (batch ${l.batchNo})  ×${l.qty}  — ${l.patient} ${l.patientName || ''}`);
    doc.moveDown(0.4);
  }
  if (!r.byEmployee.length) doc.fontSize(10).text('No pickups.');
  doc.moveDown().fontSize(14).text('By medicine').moveDown(0.3);
  for (const m of r.byMedicine) doc.fontSize(10).fillColor(m.low ? '#B42318' : '#14213D').text(`${m.name}: issued ${m.issued}, left ${m.left}${m.low ? ' (LOW)' : ''}`);
  doc.fillColor('#14213D').moveDown().fontSize(14).text('Stock added today').moveDown(0.3);
  for (const s of r.stockAdded) doc.fontSize(10).text(`${s.time}  ${s.user}: ${s.medicine} × ${s.qty} (batch ${s.batchNo})`);
  if (!r.stockAdded.length) doc.fontSize(10).text('None.');
  doc.end();
}));

module.exports = router;
