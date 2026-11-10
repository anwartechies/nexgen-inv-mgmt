import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../lib/auth';
import { useFetch } from '../../lib/useFetch';
import { fmtDate } from '../../lib/format';
import { Badge, Empty, Icon, Loading, Screen } from '../../components/ui';
import { AdminNav, MgrNav } from '../../components/navs';

export function MedRow({ m }) {
  return (
    <Link to={`/medicine/${m.id}`} className="flex items-center justify-between gap-2.5 rounded-[18px] bg-white px-3.5 py-3 text-navy no-underline shadow-card">
      <div className="min-w-0">
        <p className="m-0 truncate text-[15px] font-semibold">{m.name}</p>
        <p className="m-0 mt-0.5 text-xs text-muted">{m.Category?.name || 'Uncategorised'} · {m.batchCount} batch{m.batchCount === 1 ? '' : 'es'}</p>
      </div>
      <div className="text-right">
        <div className={`text-xl font-bold ${m.lowStock ? 'text-bad' : ''}`}>{m.stock}</div>
        {m.lowStock ? <Badge tone="bad">Low stock</Badge>
          : m.expiredCount ? <Badge tone="bad">Expired batch</Badge>
            : m.expiringCount > 1 ? <Badge>{m.expiringCount} batches expiring</Badge>
              : m.expiringCount === 1 ? <Badge>Expires {fmtDate(m.nextExpiry).replace(/ \d{4}$/, '')}</Badge> : null}
      </div>
    </Link>
  );
}

export default function Stock({ admin }) {
  const { user } = useAuth();
  const nav = useNavigate();
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('');
  const { data: cats } = useFetch('/categories');
  const { data, loading } = useFetch(`/medicines?q=${encodeURIComponent(q)}&categoryId=${cat}`);

  return (
    <Screen nav={admin ? <AdminNav /> : <MgrNav />}>
      <header className="sticky top-0 z-10 flex flex-col gap-3 border-b border-line bg-white px-5 pt-[22px] pb-3.5">
        <div className="flex items-center justify-between">
          <h1 className="m-0 text-[22px] font-extrabold">Stock</h1>
          <Link to="/profile" className="text-[13px] text-muted no-underline">{admin ? 'Super Admin' : 'Manager'} · {user.name.split(' ')[0]}</Link>
        </div>
        <label htmlFor="s" className="sr-only">Search medicine</label>
        <input id="s" type="search" placeholder="Search medicine or batch" value={q} onChange={(e) => setQ(e.target.value)}
          className="h-[46px] w-full rounded-xl border border-field bg-bg px-3.5 text-[15px] outline-none focus:border-gold" />
        <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-0.5">
          {[{ id: '', name: 'All' }, ...(cats || [])].map((c) => (
            <button key={c.id} type="button" onClick={() => setCat(c.id)}
              className={`min-h-9 rounded-full border px-3 py-2 text-[13px] font-medium whitespace-nowrap ${cat === c.id ? 'border-navy bg-navy text-gold' : 'border-field bg-white'}`}>
              {c.name}
            </button>
          ))}
        </div>
      </header>
      <div className="flex flex-col gap-2.5 px-5 pt-3 pb-24">
        {loading && !data && <Loading />}
        {data && !data.length && <Empty>No medicines found.</Empty>}
        {data?.map((m) => <MedRow key={m.id} m={m} />)}
      </div>
      <button type="button" onClick={() => nav('/mgr/add')}
        className="fixed right-[max(20px,calc(50%-208px))] bottom-[100px] flex h-14 items-center gap-2 rounded-[28px] bg-gold px-[22px] font-bold text-navy shadow-[0_6px_16px_rgba(20,33,61,.25)]">
        <Icon name="add" size={20} stroke={2.4} />Add stock
      </button>
    </Screen>
  );
}
