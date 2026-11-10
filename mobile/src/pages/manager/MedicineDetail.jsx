import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../../lib/api';
import { useFetch } from '../../lib/useFetch';
import { daysLeft, fmtDate, money } from '../../lib/format';
import { Badge, Button, Card, ErrorBox, Field, Label, Loading, Screen, Sheet, Toast, TopBar, inputCls } from '../../components/ui';

export default function MedicineDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const { data: m, reload } = useFetch(`/medicines/${id}`);
  const [edit, setEdit] = useState(null);
  const [err, setErr] = useState('');
  const [toast, setToast] = useState('');

  if (!m) return <Loading />;

  const patch = async (b, body, msg) => {
    setErr('');
    try { await api(`/batches/${b.id}`, { method: 'PATCH', body }); setToast(msg); setEdit(null); reload(); } catch (x) { setErr(x.message); }
  };

  return (
    <Screen>
      <TopBar title={m.name} />
      <div className="flex flex-col gap-3 px-5 py-4">
        <Card className="flex justify-between">
          <div><Label>In stock</Label><p className={`m-0 mt-1 text-2xl font-extrabold ${m.lowStock ? 'text-bad' : ''}`}>{m.stock} <span className="text-sm font-semibold text-muted">{m.unit.toLowerCase()}s</span></p></div>
          <div className="text-right"><Label>Price</Label><p className="m-0 mt-1 text-lg font-bold">{money(m.price)}</p></div>
          <div className="text-right"><Label>Alert below</Label><p className="m-0 mt-1 text-lg font-bold">{m.alertBelow}</p></div>
        </Card>
        <Button onClick={() => nav(`/mgr/add?medicine=${m.id}`)}>Add new batch</Button>
        <ErrorBox>{err}</ErrorBox>
        <Label className="mt-2">Batches (soonest expiry first)</Label>
        {m.Batches.map((b) => {
          const d = daysLeft(b.expiry);
          const gone = b.status !== 'active';
          return (
            <Card key={b.id} className={`flex flex-col gap-2 ${gone ? 'opacity-60' : ''}`}>
              <div className="flex items-center justify-between gap-2">
                <p className="m-0 text-base font-semibold">Batch {b.batchNo}</p>
                {gone ? <Badge tone="ok">{b.status}</Badge> : d < 0 ? <Badge tone="bad">Expired</Badge> : d <= 30 ? <Badge tone="bad">{d} days left</Badge> : d <= 90 ? <Badge>{d} days left</Badge> : null}
              </div>
              <p className="m-0 text-[13px] text-muted">{b.qty} {m.unit.toLowerCase()}s · expires {fmtDate(b.expiry)}</p>
              {b.useFirst && <p className="m-0 text-[13px] font-semibold text-gold-text">Marked “use first”</p>}
              {b.note && <p className="m-0 text-[13px] text-muted">Note: {b.note}</p>}
              {!gone && (
                <div className="flex gap-2">
                  <Button variant="outline" className="!min-h-11 text-sm" onClick={() => setEdit({ b, qty: String(b.qty), note: '' })}>Correct count</Button>
                  <Button variant={b.useFirst ? 'outline' : 'gold'} className="!min-h-11 text-sm" onClick={() => patch(b, { useFirst: !b.useFirst }, b.useFirst ? 'Removed “use first”' : 'Marked “use first”')}>
                    {b.useFirst ? 'Unmark' : 'Use first'}
                  </Button>
                </div>
              )}
            </Card>
          );
        })}
      </div>
      {edit && (
        <Sheet title={`Batch ${edit.b.batchNo}`} onClose={() => setEdit(null)}>
          <div className="flex flex-col gap-3">
            <Field label="Actual count on shelf" id="aq"><input id="aq" type="number" min="0" className={inputCls} value={edit.qty} onChange={(e) => setEdit({ ...edit, qty: e.target.value })} /></Field>
            <Field label="Reason / note" id="an"><input id="an" className={inputCls} value={edit.note} onChange={(e) => setEdit({ ...edit, note: e.target.value })} /></Field>
            <Button onClick={() => patch(edit.b, { adjustQty: Number(edit.qty), note: edit.note || undefined }, 'Count updated')}>Save count</Button>
            <Button variant="outline" onClick={() => patch(edit.b, { status: 'returned', note: edit.note || 'Returned to supplier' }, 'Batch returned')}>Return to supplier</Button>
            <Button variant="danger" onClick={() => patch(edit.b, { status: 'disposed', note: edit.note || 'Disposed' }, 'Batch disposed')}>Dispose batch</Button>
          </div>
        </Sheet>
      )}
      <Toast msg={toast} onDone={() => setToast('')} />
    </Screen>
  );
}
