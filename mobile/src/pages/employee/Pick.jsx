import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { fmtMonth } from '../../lib/format';
import { Badge, Button, Card, ErrorBox, Field, Icon, Screen, Sheet, Toast, TopBar, inputCls } from '../../components/ui';

function useSearch(path, q, min = 1) {
  const [res, setRes] = useState([]);
  useEffect(() => {
    if (q.trim().length < min) { setRes([]); return undefined; }
    const t = setTimeout(() => api(`${path}?q=${encodeURIComponent(q.trim())}`).then(setRes).catch(() => setRes([])), 250);
    return () => clearTimeout(t);
  }, [path, q, min]);
  return res;
}

export default function Pick() {
  const nav = useNavigate();
  const [patient, setPatient] = useState(null);
  const [pq, setPq] = useState('');
  const patients = useSearch('/patients', pq);
  const [newPt, setNewPt] = useState(null);

  const [med, setMed] = useState(null);
  const [mq, setMq] = useState('');
  const meds = useSearch('/medicines', mq);
  const [suggest, setSuggest] = useState(null);
  const [qty, setQty] = useState(1);
  const [cart, setCart] = useState([]);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => {
    if (!med) { setSuggest(null); return; }
    api(`/picks/suggest/${med.id}`).then(setSuggest).catch((e) => setErr(e.message));
  }, [med]);

  const inCart = (id) => cart.filter((c) => c.medicine.id === id).reduce((s, c) => s + c.qty, 0);
  const avail = suggest ? suggest.total - inCart(med?.id) : 0;
  const top = suggest?.batches[0];

  const addToCart = () => {
    if (!med || qty < 1) return;
    if (qty > avail) { setErr(`Only ${avail} left in stock`); return; }
    setCart((c) => [...c, { medicine: med, qty, batch: top }]);
    setMed(null); setMq(''); setQty(1); setErr('');
  };

  const confirm = async () => {
    setErr('');
    const items = [...cart];
    if (med && qty > 0) {
      if (qty > avail) { setErr(`Only ${avail} left in stock`); return; }
      items.push({ medicine: med, qty });
    }
    if (!patient) { setErr('Choose a patient first'); return; }
    if (!items.length) { setErr('Choose a medicine'); return; }
    setBusy(true);
    try {
      await api('/visits', { method: 'POST', body: { patientId: patient.id, items: items.map((i) => ({ medicineId: i.medicine.id, qty: i.qty })) } });
      setToast('Pickup saved');
      setTimeout(() => nav('/emp'), 900);
    } catch (x) { setErr(x.message); } finally { setBusy(false); }
  };

  const createPatient = async (e) => {
    e.preventDefault();
    try {
      const p = await api('/patients', { method: 'POST', body: newPt });
      setPatient(p); setNewPt(null); setPq('');
    } catch (x) { setErr(x.message); }
  };

  return (
    <Screen>
      <TopBar title="Pick medicine" />
      <div className="flex flex-1 flex-col gap-4 px-5 py-4">
        <Field label="1. Patient (name, phone or ID)" id="pt">
          {patient ? (
            <div className="flex h-[50px] items-center justify-between rounded-xl border border-field bg-white pr-1 pl-3.5">
              <span className="font-semibold">{patient.name} · {patient.code}</span>
              <button type="button" aria-label="Change patient" className="flex size-11 items-center justify-center text-muted" onClick={() => setPatient(null)}><Icon name="x" size={18} /></button>
            </div>
          ) : (
            <>
              <input id="pt" className={inputCls} type="search" autoComplete="off" placeholder="Search patient" value={pq} onChange={(e) => setPq(e.target.value)} />
              {pq && (
                <Card className="!p-1">
                  {patients.map((p) => (
                    <button key={p.id} type="button" onClick={() => { setPatient(p); setPq(''); }} className="flex min-h-11 w-full items-center justify-between rounded-xl px-3 py-2 text-left hover:bg-bg">
                      <span className="font-semibold">{p.name}</span><span className="text-sm text-muted">{p.code}{p.phone ? ` · ${p.phone}` : ''}</span>
                    </button>
                  ))}
                  <button type="button" onClick={() => setNewPt({ name: /\d/.test(pq) ? '' : pq, phone: /^\d+$/.test(pq) ? pq : '' })} className="flex min-h-11 w-full items-center gap-2 rounded-xl px-3 py-2 text-left font-semibold text-gold-text hover:bg-bg">
                    <Icon name="add" size={18} />New patient{pq && !/\d/.test(pq) ? ` “${pq}”` : ''}
                  </button>
                </Card>
              )}
            </>
          )}
        </Field>

        {cart.length > 0 && (
          <Card className="!py-2">
            {cart.map((c, i) => (
              <div key={i} className="flex items-center justify-between gap-2 border-b border-line-2 py-2 last:border-0">
                <span className="text-[15px] font-semibold">{c.medicine.name} × {c.qty}</span>
                <button type="button" aria-label={`Remove ${c.medicine.name}`} className="flex size-11 items-center justify-center text-muted" onClick={() => setCart(cart.filter((_, j) => j !== i))}><Icon name="x" size={18} /></button>
              </div>
            ))}
          </Card>
        )}

        <Field label={cart.length ? 'Add another medicine' : '2. Medicine'} id="med">
          {med ? (
            <div className="flex h-[50px] items-center justify-between rounded-xl border border-field bg-white pr-1 pl-3.5">
              <span className="font-semibold">{med.name}</span>
              <button type="button" aria-label="Change medicine" className="flex size-11 items-center justify-center text-muted" onClick={() => setMed(null)}><Icon name="x" size={18} /></button>
            </div>
          ) : (
            <>
              <input id="med" className={inputCls} type="search" autoComplete="off" placeholder="Search medicine" value={mq} onChange={(e) => setMq(e.target.value)} />
              {mq && (
                <Card className="!p-1">
                  {!meds.length && <p className="m-0 p-3 text-sm text-muted">No medicine found</p>}
                  {meds.map((m) => (
                    <button key={m.id} type="button" disabled={m.stock <= 0} onClick={() => { setMed(m); setMq(''); setQty(1); }} className="flex min-h-11 w-full items-center justify-between rounded-xl px-3 py-2 text-left hover:bg-bg disabled:opacity-50">
                      <span className="font-semibold">{m.name}</span><span className="text-sm text-muted">{m.stock > 0 ? `${m.stock} left` : 'Out of stock'}</span>
                    </button>
                  ))}
                </Card>
              )}
            </>
          )}
          {med && top && (
            <Card className="flex flex-col gap-2 border-2 border-gold">
              <div className="flex items-center justify-between"><span className="text-[15px] font-semibold">Batch {top.batchNo}</span><Badge>Use first</Badge></div>
              <p className="m-0 text-[13px] text-muted">Expires {fmtMonth(top.expiry)} · {top.qty} {med.unit.toLowerCase()}s in this batch · {med.Category?.name}</p>
              <p className="m-0 text-[13px] font-medium text-gold-text">
                {top.useFirst ? 'Admin marked this batch “use first”.' : 'App picks the batch that expires soonest.'}
                {suggest.batches.length > 1 && ` Total ${suggest.total} in stock.`}
              </p>
            </Card>
          )}
          {med && suggest && !top && <ErrorBox>No usable stock for this medicine.</ErrorBox>}
        </Field>

        {med && top && (
          <div className="flex flex-col gap-2">
            <span className="text-[13px] font-semibold text-muted">3. Quantity</span>
            <div className="flex items-center gap-3.5">
              <button type="button" aria-label="Decrease" className="size-12 rounded-xl border border-field bg-white text-[22px] font-semibold" onClick={() => setQty((q) => Math.max(1, q - 1))}>−</button>
              <input aria-label="Quantity" inputMode="numeric" className="w-14 bg-transparent text-center text-[26px] font-bold outline-none" value={qty} onChange={(e) => setQty(Math.max(0, Number(e.target.value.replace(/\D/g, '')) || 0))} />
              <button type="button" aria-label="Increase" className="size-12 rounded-xl border border-field bg-white text-[22px] font-semibold" onClick={() => setQty((q) => Math.min(avail, q + 1))}>+</button>
              <span className="text-sm text-muted">{med.unit.toLowerCase()}s</span>
              <button type="button" className="ml-auto min-h-11 rounded-full px-3 text-sm font-bold text-gold-text" onClick={addToCart}>+ Add more</button>
            </div>
          </div>
        )}

        <div className="mt-auto flex flex-col gap-2.5 pt-4">
          <ErrorBox>{err}</ErrorBox>
          <p className="m-0 text-center text-[13px] text-muted">Saved with your name and time. Stock reduces automatically.</p>
          <Button className="min-h-14 text-[17px]" disabled={busy} onClick={confirm}>{busy ? 'Saving…' : 'Confirm pickup'}</Button>
        </div>
      </div>

      {newPt && (
        <Sheet title="New patient" onClose={() => setNewPt(null)}>
          <form className="flex flex-col gap-3" onSubmit={createPatient}>
            <Field label="Name" id="nn"><input id="nn" className={inputCls} value={newPt.name} onChange={(e) => setNewPt({ ...newPt, name: e.target.value })} required /></Field>
            <Field label="Phone (optional)" id="np"><input id="np" className={inputCls} type="tel" value={newPt.phone} onChange={(e) => setNewPt({ ...newPt, phone: e.target.value })} /></Field>
            <Field label="Patient ID (blank = auto)" id="nc"><input id="nc" className={inputCls} value={newPt.code || ''} onChange={(e) => setNewPt({ ...newPt, code: e.target.value })} /></Field>
            <Button type="submit">Save patient</Button>
          </form>
        </Sheet>
      )}
      <Toast msg={toast} onDone={() => setToast('')} />
    </Screen>
  );
}
