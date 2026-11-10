import { Fragment, useState } from 'react';
import { api } from '../lib/api';
import { useFetch } from '../lib/useFetch';
import { daysLeft, fmtDate, money } from '../lib/format';
import { Badge, Button, Card, Empty, ErrorBox, Field, Icon, Modal, PageHead, Table, Toast, inputCls } from '../components/ui';

const UNITS = ['Vial', 'Strip', 'Bottle', 'Kit', 'Tube', 'Box', 'Unit'];

function AddStock({ cats, initial, onClose, onSaved }) {
  const [f, setF] = useState({ medicineName: '', categoryId: '', batchNo: '', expiry: '', qty: '', unit: 'Vial', price: '', alertBelow: '10', ...initial });
  const [newCat, setNewCat] = useState('');
  const [err, setErr] = useState('');
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const save = async (e) => {
    e.preventDefault(); setErr('');
    try {
      await api('/stock', { method: 'POST', body: {
        ...f, qty: Number(f.qty),
        categoryId: f.categoryId === '__new' ? null : f.categoryId || null,
        categoryName: f.categoryId === '__new' ? newCat : undefined,
      } });
      onSaved(`Saved ${f.qty} × ${f.medicineName}`);
    } catch (x) { setErr(x.message); }
  };
  return (
    <Modal title="Add stock" onClose={onClose} wide>
      <form className="grid gap-4 sm:grid-cols-2" onSubmit={save}>
        <Field label="Medicine (existing name or new)" id="am" className="sm:col-span-2">
          <input id="am" list="medlist" className={inputCls} value={f.medicineName} onChange={set('medicineName')} required readOnly={!!initial?.medicineId} />
        </Field>
        <Field label="Category" id="ac">
          <select id="ac" className={inputCls} value={f.categoryId} onChange={set('categoryId')}>
            <option value="">{initial?.medicineId ? 'Keep current' : 'Choose…'}</option>
            {cats?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            <option value="__new">+ New category</option>
          </select>
          {f.categoryId === '__new' && <input aria-label="New category" className={inputCls} placeholder="Category name" value={newCat} onChange={(e) => setNewCat(e.target.value)} required />}
        </Field>
        <Field label="Unit" id="au"><select id="au" className={inputCls} value={f.unit} onChange={set('unit')}>{UNITS.map((u) => <option key={u}>{u}</option>)}</select></Field>
        <Field label="Batch no." id="ab"><input id="ab" className={inputCls} value={f.batchNo} onChange={set('batchNo')} required /></Field>
        <Field label="Expiry date" id="ae"><input id="ae" type="date" className={inputCls} value={f.expiry} onChange={set('expiry')} required /></Field>
        <Field label="Quantity" id="aq"><input id="aq" type="number" min="1" className={inputCls} value={f.qty} onChange={set('qty')} required /></Field>
        <Field label="Price / unit (₹)" id="ap"><input id="ap" type="number" min="0" step="0.01" className={inputCls} value={f.price} onChange={set('price')} /></Field>
        <Field label="Alert below" id="al"><input id="al" type="number" min="0" className={inputCls} value={f.alertBelow} onChange={set('alertBelow')} /></Field>
        <div className="sm:col-span-2"><ErrorBox>{err}</ErrorBox></div>
        <div className="flex justify-end gap-2 sm:col-span-2">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit">Save stock</Button>
        </div>
      </form>
    </Modal>
  );
}

function EditMedicine({ m, cats, onClose, onSaved }) {
  const [f, setF] = useState({ name: m.name, CategoryId: m.CategoryId || '', unit: m.unit, price: m.price, alertBelow: m.alertBelow });
  const [err, setErr] = useState('');
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const save = async (body, msg) => {
    setErr('');
    try { await api(`/medicines/${m.id}`, { method: 'PATCH', body }); onSaved(msg); } catch (x) { setErr(x.message); }
  };
  return (
    <Modal title={`Edit ${m.name}`} onClose={onClose}>
      <form className="flex flex-col gap-3" onSubmit={(e) => { e.preventDefault(); save({ ...f, CategoryId: f.CategoryId || null }, 'Medicine updated'); }}>
        <Field label="Name" id="en"><input id="en" className={inputCls} value={f.name} onChange={set('name')} required /></Field>
        <Field label="Category" id="ec"><select id="ec" className={inputCls} value={f.CategoryId} onChange={set('CategoryId')}><option value="">None</option>{cats?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
        <div className="flex gap-3">
          <Field label="Unit" id="eu"><select id="eu" className={inputCls} value={f.unit} onChange={set('unit')}>{[...new Set([f.unit, ...UNITS])].map((u) => <option key={u}>{u}</option>)}</select></Field>
          <Field label="Price (₹)" id="ep"><input id="ep" type="number" step="0.01" className={inputCls} value={f.price} onChange={set('price')} /></Field>
          <Field label="Alert below" id="ea"><input id="ea" type="number" className={inputCls} value={f.alertBelow} onChange={set('alertBelow')} /></Field>
        </div>
        <ErrorBox>{err}</ErrorBox>
        <Button type="submit">Save</Button>
        <Button type="button" variant="danger" onClick={() => save({ active: false }, 'Medicine archived')}>Archive medicine</Button>
      </form>
    </Modal>
  );
}

function AdjustBatch({ b, unit, onClose, onSaved }) {
  const [qty, setQty] = useState(String(b.qty));
  const [note, setNote] = useState('');
  const [err, setErr] = useState('');
  const patch = async (body, msg) => {
    setErr('');
    try { await api(`/batches/${b.id}`, { method: 'PATCH', body }); onSaved(msg); } catch (x) { setErr(x.message); }
  };
  return (
    <Modal title={`Batch ${b.batchNo}`} onClose={onClose}>
      <div className="flex flex-col gap-3">
        <Field label={`Actual count (${unit.toLowerCase()}s)`} id="bq"><input id="bq" type="number" min="0" className={inputCls} value={qty} onChange={(e) => setQty(e.target.value)} /></Field>
        <Field label="Reason / note" id="bn"><input id="bn" className={inputCls} value={note} onChange={(e) => setNote(e.target.value)} /></Field>
        <ErrorBox>{err}</ErrorBox>
        <Button onClick={() => patch({ adjustQty: Number(qty), note: note || undefined }, 'Count corrected')}>Save count</Button>
        <Button variant="outline" onClick={() => patch({ useFirst: !b.useFirst }, b.useFirst ? 'Unmarked' : 'Marked “use first”')}>{b.useFirst ? 'Remove “use first”' : 'Mark “use first”'}</Button>
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={() => patch({ status: 'returned', note: note || 'Returned to supplier' }, 'Batch returned')}>Return</Button>
          <Button variant="danger" className="flex-1" onClick={() => patch({ status: 'disposed', note: note || 'Disposed' }, 'Batch disposed')}>Dispose</Button>
        </div>
      </div>
    </Modal>
  );
}

export default function Inventory() {
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('');
  const [filter, setFilter] = useState('');
  const { data: cats, reload: reloadCats } = useFetch('/categories');
  const { data, reload } = useFetch(`/medicines?q=${encodeURIComponent(q)}&categoryId=${cat}&filter=${filter}`);
  const [open, setOpen] = useState({});
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState('');
  const done = (msg) => { setModal(null); setToast(msg); reload(); reloadCats(); };

  const totalValue = (data || []).reduce((s, m) => s + m.stock * Number(m.price || 0), 0);

  return (
    <>
      <PageHead title="Inventory" sub={data ? `${data.length} medicines · stock value ${money(totalValue)}` : ''}>
        <Button onClick={() => setModal({ type: 'add' })}><Icon name="add" size={18} />Add stock</Button>
      </PageHead>
      <datalist id="medlist">{data?.map((m) => <option key={m.id} value={m.name} />)}</datalist>
      <div className="mb-4 flex flex-wrap gap-2">
        <label htmlFor="iq" className="sr-only">Search</label>
        <input id="iq" type="search" placeholder="Search medicine or batch" className={`${inputCls} max-w-xs`} value={q} onChange={(e) => setQ(e.target.value)} />
        <label htmlFor="ic" className="sr-only">Category</label>
        <select id="ic" className={`${inputCls} w-auto`} value={cat} onChange={(e) => setCat(e.target.value)}>
          <option value="">All categories</option>{cats?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <label htmlFor="if" className="sr-only">Filter</label>
        <select id="if" className={`${inputCls} w-auto`} value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="">All stock</option><option value="low">Low stock</option><option value="expiring">Expiry alerts</option>
        </select>
      </div>
      <Card className="!p-2">
        {data && !data.length ? <Empty>No medicines found.</Empty> : (
          <Table head={['', 'Medicine', 'Category', { label: 'In stock', right: true }, { label: 'Price', right: true }, 'Alerts', { label: '', right: true }]}>
            {data?.map((m) => (
              <Fragment key={m.id}>
                <tr className="cursor-pointer hover:bg-bg" onClick={() => setOpen({ ...open, [m.id]: !open[m.id] })}>
                  <td className="w-8"><Icon name="chev" size={16} className={`transition-transform ${open[m.id] ? '' : '-rotate-90'}`} /></td>
                  <td className="font-semibold">{m.name}</td>
                  <td>{m.Category?.name || '—'}</td>
                  <td className={`text-right font-bold ${m.lowStock ? 'text-bad' : ''}`}>{m.stock} <span className="font-normal text-muted">{m.unit.toLowerCase()}s</span></td>
                  <td className="text-right">{money(m.price)}</td>
                  <td className="space-x-1">
                    {m.lowStock && <Badge tone="bad">Low</Badge>}
                    {m.expiredCount > 0 && <Badge tone="bad">Expired batch</Badge>}
                    {m.expiringCount > 0 && <Badge>{m.expiringCount} expiring</Badge>}
                  </td>
                  <td className="text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                    <Button size="sm" variant="ghost" onClick={() => setModal({ type: 'edit', m })}>Edit</Button>
                    <Button size="sm" variant="outline" onClick={() => setModal({ type: 'add', initial: { medicineId: m.id, medicineName: m.name, unit: m.unit, price: m.price, alertBelow: String(m.alertBelow) } })}>+ Batch</Button>
                  </td>
                </tr>
                {open[m.id] && m.Batches.map((b) => {
                  const d = daysLeft(b.expiry);
                  return (
                    <tr key={b.id} className={`bg-bg/60 text-[13px] ${b.status !== 'active' ? 'opacity-50' : ''}`}>
                      <td />
                      <td colSpan={2} className="pl-6">Batch <b>{b.batchNo}</b>{b.note && <span className="text-muted"> · {b.note}</span>}</td>
                      <td className="text-right">{b.qty}</td>
                      <td className="text-right">{fmtDate(b.expiry)}</td>
                      <td className="space-x-1">
                        {b.status !== 'active' ? <Badge tone="muted">{b.status}</Badge> : d < 0 ? <Badge tone="bad">Expired</Badge> : d <= 30 ? <Badge tone="bad">{d}d left</Badge> : d <= 90 ? <Badge>{d}d left</Badge> : null}
                        {b.useFirst && <Badge tone="ok">Use first</Badge>}
                      </td>
                      <td className="text-right">{b.status === 'active' && <Button size="sm" variant="ghost" onClick={() => setModal({ type: 'batch', b, unit: m.unit })}>Manage</Button>}</td>
                    </tr>
                  );
                })}
              </Fragment>
            ))}
          </Table>
        )}
      </Card>
      {modal?.type === 'add' && <AddStock cats={cats} initial={modal.initial} onClose={() => setModal(null)} onSaved={done} />}
      {modal?.type === 'edit' && <EditMedicine m={modal.m} cats={cats} onClose={() => setModal(null)} onSaved={done} />}
      {modal?.type === 'batch' && <AdjustBatch b={modal.b} unit={modal.unit} onClose={() => setModal(null)} onSaved={done} />}
      <Toast msg={toast} onDone={() => setToast('')} />
    </>
  );
}
