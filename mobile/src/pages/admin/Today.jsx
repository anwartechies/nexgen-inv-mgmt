import { Link, useNavigate } from 'react-router-dom';
import { useFetch } from '../../lib/useFetch';
import { money, todayLabel } from '../../lib/format';
import { Button, Card, DarkHeader, Empty, Icon, Label, Screen } from '../../components/ui';
import { AdminNav } from '../../components/navs';

export default function Today() {
  const nav = useNavigate();
  const { data: r } = useFetch('/reports/today');
  return (
    <Screen nav={<AdminNav />}>
      <DarkHeader className="flex items-start justify-between">
        <div>
          <p className="m-0 text-[13px] text-gold-muted">{todayLabel()} · Super Admin</p>
          <h1 className="m-0 mt-1 text-2xl font-extrabold">Today at the clinic</h1>
        </div>
        <Link to="/profile" aria-label="My account" className="flex size-11 items-center justify-center rounded-full bg-gold font-extrabold text-navy no-underline">A</Link>
      </DarkHeader>
      <div className="flex flex-col gap-3 px-5 py-4">
        {r && (r.expiring30 > 0 || r.expiredBatches > 0) && (
          <Link to="/admin/expiry" className="flex items-center gap-3 rounded-[18px] bg-bad-bg px-4 py-3.5 text-[#8F1D12] no-underline">
            <Icon name="alert" size={24} />
            <span className="flex-1 text-[15px] leading-snug font-semibold">
              {r.expiring30} batch{r.expiring30 === 1 ? '' : 'es'} expire in 30 days{r.expiredBatches ? `, ${r.expiredBatches} already expired` : ''}
            </span>
            <span className="text-sm font-extrabold">View</span>
          </Link>
        )}
        <div className="grid grid-cols-2 gap-2.5">
          <Card className="!bg-navy"><Label className="!text-gold-muted">Items issued</Label><p className="m-0 mt-1.5 text-2xl font-bold text-white">{r?.itemsIssued ?? '–'}</p></Card>
          <Card className="!bg-gold"><Label className="!text-navy">Sold value</Label><p className="m-0 mt-1.5 text-2xl font-bold">{r ? money(r.soldValue) : '–'}</p></Card>
          <Card><Label>Staff visits</Label><p className="m-0 mt-1.5 text-2xl font-bold">{r?.staffVisits ?? '–'}</p></Card>
          <Link to="/admin/stock" className="no-underline"><Card><Label>Low stock</Label><p className="m-0 mt-1.5 text-2xl font-bold text-bad">{r?.lowStock ?? '–'}</p></Card></Link>
        </div>
        <Card className="!pb-1">
          <Label className="mb-1">Who went to inventory</Label>
          {r && !r.byEmployee.length && <Empty>No pickups yet today.</Empty>}
          {r?.byEmployee.map((e) => (
            <div key={e.userId} className="flex items-center justify-between border-t border-line-2 py-[11px] text-[15px]">
              <span className="font-semibold">{e.name}</span>
              <span className="text-muted">{e.visits} visit{e.visits === 1 ? '' : 's'} · {e.items} items</span>
            </div>
          ))}
        </Card>
        <Button onClick={() => nav('/admin/report')}>Open full EOD report</Button>
      </div>
    </Screen>
  );
}
