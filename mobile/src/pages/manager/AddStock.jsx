import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../../lib/api';
import { useFetch } from '../../lib/useFetch';
import { Button, Card, ErrorBox, Field, Screen, Toast, TopBar, inputCls } from '../../components/ui';

const UNITS = ['Vial', 'Strip', 'Bottle', 'Kit', 'Tube', 'Box', 'Unit'];
const blank = { medicineName: '', medicineId: null, categoryId: '', batchNo: '', expiry: '', qty: '', unit: 'Vial', price: '', alertBelow: '10' };

export default function AddStock() {
  const nav = useNavigate();
  const [params] = useSearchParams();
  const { data: cats } = useFetch('/categories');
  const [f, setF] = useState(blank);
  const [matches, setMatches] = useState([]);
  const [newCat, setNewCat] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState('');
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));

  const pickMed = (m) => {
    setF((x) => ({ ...x, medicineId: m.id, medicineName: m.name, categoryId: m.CategoryId || '', unit: m.unit, price: m.price ?? '', alertBelow: String(m.alertBelow) }));
    setMatches([]);
  };

  useEffect(() => {
    const id = params.get('medicine');
    if (id) api(`/medicines/${id}`).then(pickMed).catch(() => {});
  }, [params]);

  useEffect(() => {
    if (f.medicineId || f.medicineName.trim().length < 2) { setMatches([]); return undefined; }
    const t = setTimeout(() => api(`/medicines?q=${encodeURIComponent(f.medicineName.trim())}`).then(setMatches).catch(() => {}), 250);
    return () => clearTimeout(t);
  }, [f.medicineName, f.medicineId]);

  const save = async (e) => {
    e.preventDefault(); setErr(''); setBusy(true);
    try {
      await api('/stock', {
        method: 'POST',
        body: {
          medicineId: f.medicineId, medicineName: f.medicineName,
          categoryId: f.categoryId === '__new' ? null : f.categoryId || null,
          categoryName: f.categoryId === '__new' ? newCat : undefined,
          batchNo: f.batchNo, expiry: f.expiry, qty: Number(f.qty), unit: f.unit, price: f.price, alertBelow: f.alertBelow,
        },
      });
      setToast(`Saved ${f.qty} × ${f.medicineName}`);
      setF(blank); setNewCat('');
    } catch (x) { setErr(x.message); } finally { setBusy(false); }
  };

  return (
    <Screen>
      <TopBar title="Add stock" />
      <form className="flex flex-1 flex-col gap-3.5 px-5 py-4" onSubmit={save}>
        <Field label="Medicine (search or add new)" id="m">
          <input id="m" className={inputCls} autoComplete="off" value={f.medicineName} required
            onChange={(e) => setF((x) => ({ ...x, medicineName: e.target.value, medicineId: null }))} />
          {matches.length > 0 && (
            <Card className="!p-1">
              {matches.map((m) => (
                <button key={m.id} type="button" onClick={() => pickMed(m)} className="flex min-h-11 w-full items-center justify-between rounded-xl px-3 text-left hover:bg-bg">
                  <span className="font-semibold">{m.name}</span><span className="text-sm text-muted">{m.stock} in stock</span>
                </button>
              ))}
            </Card>
          )}
          {f.medicineName && !f.medicineId && !matches.length && <p className="m-0 text-xs text-gold-text">New medicine will be created.</p>}
        </Field>
        <Field label="Category" id="c">
          <select id="c" className={inputCls} value={f.categoryId} onChange={set('categoryId')}>
            <option value="">Choose…</option>
            {cats?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            <option value="__new">+ New category</option>
          </select>
          {f.categoryId === '__new' && <input aria-label="New category name" className={inputCls} placeholder="Category name" value={newCat} onChange={(e) => setNewCat(e.target.value)} required />}
        </Field>
        <div className="flex gap-3">
          <Field label="Batch no." id="b"><input id="b" className={inputCls} value={f.batchNo} onChange={set('batchNo')} required /></Field>
          <Field label="Expiry date" id="e"><input id="e" className={inputCls} type="date" value={f.expiry} onChange={set('expiry')} required /></Field>
        </div>
        <div className="flex gap-3">
          <Field label="Quantity" id="q"><input id="q" className={inputCls} type="number" min="1" inputMode="numeric" value={f.qty} onChange={set('qty')} required /></Field>
          <Field label="Unit" id="u"><select id="u" className={inputCls} value={f.unit} onChange={set('unit')}>{UNITS.map((u) => <option key={u}>{u}</option>)}</select></Field>
        </div>
        <div className="flex gap-3">
          <Field label="Price / unit (₹)" id="p"><input id="p" className={inputCls} type="number" min="0" step="0.01" value={f.price} onChange={set('price')} /></Field>
          <Field label="Alert below" id="l"><input id="l" className={inputCls} type="number" min="0" value={f.alertBelow} onChange={set('alertBelow')} /></Field>
        </div>
        <p className="m-0 text-[13px] leading-normal text-muted">New batch of the same medicine is saved separately, with its own expiry date.</p>
        <ErrorBox>{err}</ErrorBox>
        <div className="mt-auto flex flex-col gap-2">
          <Button type="submit" className="min-h-14 text-[17px]" disabled={busy}>{busy ? 'Saving…' : 'Save stock'}</Button>
          <Button type="button" variant="outline" onClick={() => nav(-1)}>Done</Button>
        </div>
      </form>
      <Toast msg={toast} onDone={() => setToast('')} />
    </Screen>
  );
}
