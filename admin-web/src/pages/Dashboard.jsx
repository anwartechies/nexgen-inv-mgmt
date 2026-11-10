import { Link } from 'react-router-dom';
import { useFetch } from '../lib/useFetch';
import { money } from '../lib/format';
import { Card, Empty, Icon, Label, PageHead, Stat, Table } from '../components/ui';

export default function Dashboard() {
  const { data: r } = useFetch('/reports/today');
  const { data: low } = useFetch('/medicines?filter=low');
  const max = Math.max(1, ...(r?.byMedicine || []).map((m) => m.issued));
  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <>
      <PageHead title="Today at the clinic" sub={today} />
      {r && (r.expiring30 > 0 || r.expiredBatches > 0) && (
        <Link to="/expiry" className="mb-5 flex items-center gap-3 rounded-[18px] bg-bad-bg px-5 py-4 text-[#8F1D12] no-underline">
          <Icon name="alert" size={24} />
          <span className="flex-1 font-semibold">{r.expiring30} batch{r.expiring30 === 1 ? '' : 'es'} expire in 30 days{r.expiredBatches ? `, ${r.expiredBatches} already expired` : ''}</span>
          <span className="text-sm font-extrabold">View</span>
        </Link>
      )}
      <div className="mb-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Items issued" value={r?.itemsIssued ?? '–'} tone="navy" />
        <Stat label="Sold value" value={r ? money(r.soldValue) : '–'} tone="gold" />
        <Stat label="Staff visits" value={r?.staffVisits ?? '–'} />
        <Stat label="Low stock" value={r?.lowStock ?? '–'} tone="bad" />
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <Label className="mb-3">Who went to inventory</Label>
          {r && !r.byEmployee.length && <Empty>No pickups yet today.</Empty>}
          {r?.byEmployee.length > 0 && (
            <Table head={['Employee', 'Visits', { label: 'Items', right: true }, { label: 'Value', right: true }]}>
              {r.byEmployee.map((e) => (
                <tr key={e.userId}><td className="font-semibold">{e.name}</td><td className="text-muted">{e.visitTimes.join(' · ')}</td><td className="text-right">{e.items}</td><td className="text-right">{money(e.value)}</td></tr>
              ))}
            </Table>
          )}
        </Card>
        <Card>
          <Label className="mb-3">Issued today by medicine</Label>
          {r && !r.byMedicine.length && <Empty>Nothing issued yet.</Empty>}
          <div className="flex flex-col gap-3">
            {r?.byMedicine.map((m) => (
              <div key={m.medicineId}>
                <div className="mb-1 flex justify-between text-sm"><span className="font-semibold">{m.name}</span><span className="text-muted">{m.issued} issued · <span className={m.low ? 'font-bold text-bad' : ''}>{m.left} left</span></span></div>
                <div className="h-2.5 rounded-full bg-line-2"><div className="h-2.5 rounded-full bg-gold" style={{ width: `${(m.issued / max) * 100}%` }} /></div>
              </div>
            ))}
          </div>
        </Card>
        <Card className="lg:col-span-2">
          <div className="mb-3 flex items-center justify-between"><Label>Low stock — reorder</Label><Link to="/inventory" className="text-sm font-semibold">Open inventory</Link></div>
          {low && !low.length && <Empty>Nothing is low.</Empty>}
          {low?.length > 0 && (
            <Table head={['Medicine', 'Category', { label: 'In stock', right: true }, { label: 'Alert below', right: true }]}>
              {low.map((m) => <tr key={m.id}><td className="font-semibold">{m.name}</td><td>{m.Category?.name}</td><td className="text-right font-bold text-bad">{m.stock}</td><td className="text-right">{m.alertBelow}</td></tr>)}
            </Table>
          )}
        </Card>
      </div>
    </>
  );
}
