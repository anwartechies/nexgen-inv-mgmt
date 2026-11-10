import { useState } from 'react';
import { api } from '../../lib/api';
import { useFetch } from '../../lib/useFetch';
import { fmtDate } from '../../lib/format';
import { Badge, Button, Card, DarkHeader, Empty, ErrorBox, Field, Loading, Screen, Sheet, Toast, inputCls } from '../../components/ui';
import { AdminNav } from '../../components/navs';

export default function Expiry() {
  const [win, setWin] = useState('30');
  const { data, loading, reload } = useFetch(`/reports/expiry?window=${win}`);
  const [act, setAct] = useState(null);
  const [err, setErr] = useState('');
  const [toast, setToast] = useState('');

  const patch = async (id, body, msg) => {
    setErr('');
    try { await api(`/batches/${id}`, { method: 'PATCH', body }); setToast(msg); setAct(null); reload(); } catch (x) { setErr(x.message); }
  };
  const tabs = [['expired', 'Expired'], ['30', '30 days'], ['90', '90 days']];

  return (
    <Screen nav={<AdminNav />}>
      <DarkHeader className="flex flex-col gap-3">
        <h1 className="m-0 text-[22px] font-extrabold">Expiry watch</h1>
        <div className="flex gap-2">
          {tabs.map(([k, l]) => (
            <button key={k} type="button" onClick={() => setWin(k)}
              className={`min-h-10 flex-1 rounded-full border text-[13px] font-semibold ${win === k ? 'border-gold bg-gold text-navy' : 'border-[#3A4766] text-white'}`}>
              {l} ({data?.counts[k] ?? '…'})
            </button>
          ))}
        </div>
      </DarkHeader>
      <div className="flex flex-col gap-3 px-5 py-3.5">
        <ErrorBox>{err}</ErrorBox>
        {loading && !data && <Loading />}
        {data && !data.batches.length && <Empty>No batches here.</Empty>}
        {data?.batches.map((b) => (
          <Card key={b.id} className="flex flex-col gap-2">
            <div className="flex justify-between gap-2.5">
              <p className="m-0 text-base font-semibold">{b.Medicine.name}</p>
              <Badge tone={b.daysLeft <= 20 ? 'bad' : 'warn'}>{b.daysLeft < 0 ? `Expired ${-b.daysLeft}d ago` : `${b.daysLeft} days left`}</Badge>
            </div>
            <p className="m-0 text-[13px] text-muted">Batch {b.batchNo} · {b.qty} {b.Medicine.unit.toLowerCase()}s · expires {fmtDate(b.expiry)}</p>
            {b.note && <p className="m-0 text-[13px] text-muted">Note: {b.note}</p>}
            {b.useFirst && <p className="m-0 text-[13px] font-semibold text-gold-text">Marked “use first” · staff are picking this batch</p>}
            <div className="mt-0.5 flex gap-2">
              {b.daysLeft >= 0 && !b.useFirst && <Button className="!min-h-11 text-sm" onClick={() => patch(b.id, { useFirst: true }, 'Marked “use first”')}>Use first</Button>}
              <Button variant="outline" className="!min-h-11 text-sm" onClick={() => setAct({ b, note: b.note || '' })}>Return / note</Button>
            </div>
          </Card>
        ))}
        <p className="m-0 text-[13px] leading-normal text-muted">“Use first” puts this batch on top of the employee pick screen so it gets used before it expires.</p>
      </div>
      {act && (
        <Sheet title={`${act.b.Medicine.name} · ${act.b.batchNo}`} onClose={() => setAct(null)}>
          <div className="flex flex-col gap-3">
            <Field label="Note" id="n"><input id="n" className={inputCls} value={act.note} onChange={(e) => setAct({ ...act, note: e.target.value })} /></Field>
            <Button onClick={() => patch(act.b.id, { note: act.note }, 'Note saved')}>Save note</Button>
            <Button variant="outline" onClick={() => patch(act.b.id, { status: 'returned', note: act.note || 'Returned to supplier' }, 'Batch returned')}>Return to supplier</Button>
            <Button variant="danger" onClick={() => patch(act.b.id, { status: 'disposed', note: act.note || 'Disposed' }, 'Batch disposed')}>Dispose</Button>
          </div>
        </Sheet>
      )}
      <Toast msg={toast} onDone={() => setToast('')} />
    </Screen>
  );
}
