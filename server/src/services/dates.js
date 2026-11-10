// Day boundaries in clinic timezone (IST by default).
const env = require('../config/env');

function dayRange(dateStr) {
  const d = dateStr || todayStr();
  const start = new Date(`${d}T00:00:00${env.timezone}`);
  const end = new Date(start.getTime() + 24 * 3600 * 1000);
  return { start, end, date: d };
}
function todayStr() {
  const [sign, hh, mm] = [env.timezone[0], ...env.timezone.slice(1).split(':')];
  const off = (sign === '-' ? -1 : 1) * (Number(hh) * 60 + Number(mm)) * 60000;
  return new Date(Date.now() + off).toISOString().slice(0, 10);
}
function addDays(dateStr, n) {
  const d = new Date(dateStr + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
module.exports = { dayRange, todayStr, addDays };
