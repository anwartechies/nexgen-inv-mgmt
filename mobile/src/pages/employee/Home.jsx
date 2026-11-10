import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../lib/auth';
import { useFetch } from '../../lib/useFetch';
import { fmtTime, todayISO, todayLabel } from '../../lib/format';
import { Button, Card, Empty, Icon, Label, Screen } from '../../components/ui';
import { EmpNav } from '../../components/navs';

export default function EmpHome() {
  const { user } = useAuth();
  const nav = useNavigate();
  const { data: visits } = useFetch(`/visits?mine=1&date=${todayISO()}`);
  const lines = (visits || []).flatMap((v) => v.items.map((it) => ({ ...it, v })));
  const items = lines.reduce((s, l) => s + l.qty, 0);

  return (
    <Screen nav={<EmpNav />}>
      <header className="flex items-start justify-between border-b border-line bg-white px-5 pt-6 pb-4">
        <div>
          <p className="m-0 text-[13px] text-muted">{todayLabel()} · Employee</p>
          <h1 className="m-0 mt-1 text-2xl font-extrabold">Hi, {user.name.split(' ')[0]}</h1>
        </div>
        <Link to="/profile" aria-label="My account" className="flex size-11 items-center justify-center rounded-full bg-gold-soft font-extrabold text-gold-ink no-underline">
          {user.name[0]}
        </Link>
      </header>
      <div className="flex flex-col gap-3.5 px-5 py-4">
        <Card className="flex flex-col gap-3 !py-[18px]">
          <p className="m-0 text-base font-semibold">Giving medicine to a patient?</p>
          <Button className="min-h-14 text-[17px]" onClick={() => nav('/emp/pick')}><Icon name="plus" />Pick medicine</Button>
        </Card>
        <div className="flex gap-2.5">
          <Card className="flex-1"><Label>Today's visits</Label><p className="m-0 mt-1.5 text-[26px] font-extrabold">{visits ? visits.length : '–'}</p></Card>
          <Card className="flex-1"><Label>Items picked</Label><p className="m-0 mt-1.5 text-[26px] font-extrabold">{visits ? items : '–'}</p></Card>
        </div>
        <Card className="!pb-1">
          <Label className="mb-1">What I picked today</Label>
          {visits && !lines.length && <Empty>Nothing picked yet today.</Empty>}
          {lines.map((l) => (
            <div key={l.id} className="flex items-start justify-between gap-3 border-t border-line-2 py-3">
              <div>
                <p className="m-0 text-[15px] font-semibold">{l.Medicine.name} × {l.qty}</p>
                <p className="m-0 mt-0.5 text-[13px] text-muted">For {l.v.Patient?.name} · {l.v.Patient?.code}</p>
              </div>
              <span className="text-[13px] whitespace-nowrap text-muted">{fmtTime(l.v.createdAt)}</span>
            </div>
          ))}
        </Card>
      </div>
    </Screen>
  );
}
