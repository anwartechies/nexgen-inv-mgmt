export const fmtTime = (d) => new Date(d).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' }).toLowerCase();
export const fmtDate = (d) => new Date(d.length === 10 ? d + 'T00:00:00' : d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
export const fmtMonth = (d) => new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
export const todayLabel = () => new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
export const money = (n) => '₹ ' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });
export const todayISO = () => {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
};
export const daysLeft = (expiry) => Math.round((new Date(expiry + 'T00:00:00') - new Date(todayISO() + 'T00:00:00')) / 864e5);
export const ROLE_LABEL = { super_admin: 'Super Admin', manager: 'Manager', employee: 'Employee' };
