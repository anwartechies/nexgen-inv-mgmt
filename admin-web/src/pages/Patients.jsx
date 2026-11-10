import { useState } from 'react';
import { useFetch } from '../lib/useFetch';
import { fmtDate, fmtTime } from '../lib/format';
import { Card, Empty, Modal, PageHead, Table, inputCls } from '../components/ui';

function History({ p, onClose }) {
  const { data } = useFetch(`/visits?patientId=${p.id}&limit=200`);
  return (
    <Modal title={`${p.name} · ${p.code}`} onClose={onClose} wide>
      {data && !data.length && <Empty>No pickups for this patient.</Empty>}
      {data?.length > 0 && (
        <Table head={['When', 'By', 'Medicine', { label: 'Qty', right: true }]}>
          {data.flatMap((v) => v.items.map((it) => (
            <tr key={it.id}><td className="text-muted">{fmtDate(v.createdAt)} · {fmtTime(v.createdAt)}</td><td>{v.User?.name}</td><td>{it.Medicine.name}</td><td className="text-right">{it.qty}</td></tr>
          )))}
        </Table>
      )}
    </Modal>
  );
}

export default function Patients() {
  const [q, setQ] = useState('');
  const [sel, setSel] = useState(null);
  const { data } = useFetch(`/patients?q=${encodeURIComponent(q)}`);
  return (
    <>
      <PageHead title="Patients" sub="Employees add patients from the pick screen. Showing the 20 most recent or best matches." />
      <label htmlFor="pq" className="sr-only">Search patients</label>
      <input id="pq" type="search" className={`${inputCls} mb-4 max-w-sm`} placeholder="Search name, phone or ID" value={q} onChange={(e) => setQ(e.target.value)} />
      <Card className="!p-2">
        {data && !data.length ? <Empty>No patients found.</Empty> : (
          <Table head={['ID', 'Name', 'Phone', 'Last activity', '']}>
            {data?.map((p) => (
              <tr key={p.id}>
                <td className="font-semibold">{p.code}</td><td>{p.name}</td><td>{p.phone || '—'}</td><td className="text-muted">{fmtDate(p.updatedAt)}</td>
                <td className="text-right"><button type="button" className="min-h-9 rounded-full px-3 text-sm font-semibold hover:bg-bg" onClick={() => setSel(p)}>History</button></td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
      {sel && <History p={sel} onClose={() => setSel(null)} />}
    </>
  );
}
