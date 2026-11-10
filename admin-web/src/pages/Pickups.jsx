import { useState } from 'react';
import { useFetch } from '../lib/useFetch';
import { fmtDate, fmtTime, money, todayISO } from '../lib/format';
import { Card, Empty, Field, PageHead, Table, inputCls } from '../components/ui';

export default function Pickups() {
  const [from, setFrom] = useState(todayISO());
  const [to, setTo] = useState(todayISO());
  const [userId, setUserId] = useState('');
  const { data: users } = useFetch('/users');
  const { data } = useFetch(`/visits?from=${from}&to=${to}&userId=${userId}&limit=500`);
  const rows = (data || []).flatMap((v) => v.items.map((it) => ({ v, it })));
  const total = rows.reduce((s, r) => s + r.it.qty * Number(r.it.unitPrice || 0), 0);

  return (
    <>
      <PageHead title="Pickups" sub={data ? `${data.length} visits · ${rows.reduce((s, r) => s + r.it.qty, 0)} items · ${money(total)}` : ''} />
      <div className="mb-4 flex flex-wrap gap-3">
        <Field label="From" id="pf" className="!flex-none"><input id="pf" type="date" className={inputCls} value={from} onChange={(e) => setFrom(e.target.value)} /></Field>
        <Field label="To" id="pt" className="!flex-none"><input id="pt" type="date" className={inputCls} value={to} onChange={(e) => setTo(e.target.value)} /></Field>
        <Field label="Employee" id="pu" className="!flex-none">
          <select id="pu" className={inputCls} value={userId} onChange={(e) => setUserId(e.target.value)}>
            <option value="">Everyone</option>{users?.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        </Field>
      </div>
      <Card className="!p-2">
        {data && !rows.length ? <Empty>No pickups in this range.</Empty> : (
          <Table head={['When', 'Employee', 'Patient', 'Medicine', 'Batch', { label: 'Qty', right: true }, { label: 'Value', right: true }]}>
            {rows.map(({ v, it }) => (
              <tr key={it.id}>
                <td className="whitespace-nowrap text-muted">{fmtDate(v.createdAt)} · {fmtTime(v.createdAt)}</td>
                <td className="font-semibold">{v.User?.name}</td>
                <td>{v.Patient?.name} <span className="text-muted">{v.Patient?.code}</span></td>
                <td>{it.Medicine.name}</td>
                <td>{it.Batch?.batchNo}</td>
                <td className="text-right">{it.qty}</td>
                <td className="text-right">{money(it.qty * Number(it.unitPrice || 0))}</td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
    </>
  );
}
