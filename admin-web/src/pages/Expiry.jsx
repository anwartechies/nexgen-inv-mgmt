import { useState } from 'react';
import { api } from '../lib/api';
import { useFetch } from '../lib/useFetch';
import { fmtDate } from '../lib/format';
import { Badge, Button, Card, Empty, ErrorBox, Field, Modal, PageHead, Table, Toast, inputCls } from '../components/ui';

export default function Expiry() {
  const [win, setWin] = useState('30');
  const { data, reload } = useFetch(`/reports/expiry?window=${win}`);
  const [act, setAct] = useState(null);
  const [err, setErr] = useState('');
  const [toast, setToast] = useState('');

  const patch = async (id, body, msg) => {
    setErr('');
    try { await api(`/batches/${id}`, { method: 'PATCH', body }); setToast(msg); setAct(null); reload(); } catch (x) { setErr(x.message); }
  };

  return (
    <>
      <PageHead title="Expiry watch" sub="“Use first” puts a batch on top of the employee pick screen so it gets used before it expires.">
        {[['expired', 'Expired'], ['30', '30 days'], ['90', '90 days']].map(([k, l]) => (
          <button key={k} type="button" onClick={() => setWin(k)}
            className={`min-h-10 rounded-full border px-4 text-sm font-semibold ${win === k ? 'border-navy bg-navy text-gold' : 'border-field bg-white'}`}>
            {l} ({data?.counts[k] ?? '…'})
          </button>
        ))}
      </PageHead>
      <ErrorBox>{err}</ErrorBox>
      <Card className="mt-3 !p-2">
        {data && !data.batches.length ? <Empty>No batches in this window.</Empty> : (
          <Table head={['Medicine', 'Batch', { label: 'Qty', right: true }, 'Expires', 'Status', { label: '', right: true }]}>
            {data?.batches.map((b) => (
              <tr key={b.id}>
                <td className="font-semibold">{b.Medicine.name}{b.note && <p className="m-0 text-xs font-normal text-muted">Note: {b.note}</p>}</td>
                <td>{b.batchNo}</td>
                <td className="text-right">{b.qty} {b.Medicine.unit.toLowerCase()}s</td>
                <td>{fmtDate(b.expiry)}</td>
                <td className="space-x-1">
                  <Badge tone={b.daysLeft <= 20 ? 'bad' : 'warn'}>{b.daysLeft < 0 ? `Expired ${-b.daysLeft}d ago` : `${b.daysLeft} days left`}</Badge>
                  {b.useFirst && <Badge tone="ok">Use first</Badge>}
                </td>
                <td className="text-right whitespace-nowrap">
                  {b.daysLeft >= 0 && (b.useFirst
                    ? <Button size="sm" variant="ghost" onClick={() => patch(b.id, { useFirst: false }, 'Unmarked')}>Unmark</Button>
                    : <Button size="sm" onClick={() => patch(b.id, { useFirst: true }, 'Marked “use first”')}>Use first</Button>)}
                  <Button size="sm" variant="outline" className="ml-2" onClick={() => setAct({ b, note: b.note || '' })}>Return / note</Button>
                </td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
      {act && (
        <Modal title={`${act.b.Medicine.name} · ${act.b.batchNo}`} onClose={() => setAct(null)}>
          <div className="flex flex-col gap-3">
            <Field label="Note" id="n"><input id="n" className={inputCls} value={act.note} onChange={(e) => setAct({ ...act, note: e.target.value })} /></Field>
            <Button onClick={() => patch(act.b.id, { note: act.note }, 'Note saved')}>Save note</Button>
            <Button variant="outline" onClick={() => patch(act.b.id, { status: 'returned', note: act.note || 'Returned to supplier' }, 'Batch returned')}>Return to supplier (removes {act.b.qty} from stock)</Button>
            <Button variant="danger" onClick={() => patch(act.b.id, { status: 'disposed', note: act.note || 'Disposed' }, 'Batch disposed')}>Dispose</Button>
          </div>
        </Modal>
      )}
      <Toast msg={toast} onDone={() => setToast('')} />
    </>
  );
}
