import { Fragment, useState } from 'react';
import { download } from '../lib/api';
import { useFetch } from '../lib/useFetch';
import { money, todayISO } from '../lib/format';
import { Button, Card, Empty, Label, PageHead, Stat, Table, inputCls } from '../components/ui';

function whatsappText(r) {
  const lines = [
    `*NexGen EOD report — ${r.date}*`,
    `Items issued: ${r.itemsIssued} · Staff: ${r.staffCount} · Sold: ${money(r.soldValue)}`,
    `Low stock: ${r.lowStock} · Expiring (30d): ${r.expiring30} · Expired: ${r.expiredBatches}`,
    '', '*By employee*', ...r.byEmployee.map((e) => `${e.name}: ${e.items} items, ${e.visits} visits`),
    '', '*By medicine*', ...r.byMedicine.map((m) => `${m.name}: issued ${m.issued}, left ${m.left}${m.low ? ' (LOW)' : ''}`),
  ];
  if (r.stockAdded.length) lines.push('', '*Stock added*', ...r.stockAdded.map((s) => `${s.user}: ${s.medicine} × ${s.qty} (${s.batchNo})`));
  return lines.join('\n');
}

export default function Report() {
  const [date, setDate] = useState(todayISO());
  const { data: r } = useFetch(`/reports/eod?date=${date}`);

  return (
    <>
      <PageHead title="End-of-day report" sub="Who picked what, what is left, and what came in.">
        <label htmlFor="d" className="sr-only">Date</label>
        <input id="d" type="date" className={`${inputCls} w-auto`} value={date} max={todayISO()} onChange={(e) => setDate(e.target.value)} />
        <Button onClick={() => download(`/reports/eod.pdf?date=${date}`, `EOD-${date}.pdf`)}>Download PDF</Button>
        <a href={r ? `https://wa.me/?text=${encodeURIComponent(whatsappText(r))}` : undefined} target="_blank" rel="noreferrer"
          className="inline-flex min-h-11 items-center rounded-full border border-field bg-white px-5 text-[15px] font-semibold text-navy no-underline">Share on WhatsApp</a>
      </PageHead>
      {r && (
        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Stat label="Items issued" value={r.itemsIssued} tone="navy" />
            <Stat label="Staff" value={r.staffCount} />
            <Stat label="Visits" value={r.staffVisits} />
            <Stat label="Sold value" value={money(r.soldValue)} tone="gold" />
          </div>
          <Card>
            <Label className="mb-3">By employee</Label>
            {!r.byEmployee.length ? <Empty>No pickups on this day.</Empty> : (
              <Table head={['Time', 'Medicine', 'Batch', 'Patient', { label: 'Qty', right: true }]}>
                {r.byEmployee.map((e) => (
                  <Fragment key={e.userId}>
                    <tr className="bg-bg"><td colSpan={5}><span className="font-extrabold">{e.name}</span> <span className="text-muted">· {e.items} items · {e.visits} visits · {money(e.value)}</span></td></tr>
                    {e.lines.map((l, i) => (
                      <tr key={i}><td className="text-muted">{l.time}</td><td>{l.medicine}</td><td>{l.batchNo}</td><td>{l.patient} {l.patientName}</td><td className="text-right">{l.qty}</td></tr>
                    ))}
                  </Fragment>
                ))}
              </Table>
            )}
          </Card>
          <div className="grid gap-5 lg:grid-cols-2">
            <Card>
              <Label className="mb-3">By medicine</Label>
              {!r.byMedicine.length ? <Empty>Nothing issued.</Empty> : (
                <Table head={['Medicine', { label: 'Issued', right: true }, { label: 'Value', right: true }, { label: 'Left', right: true }]}>
                  {r.byMedicine.map((m) => (
                    <tr key={m.medicineId}><td>{m.name}</td><td className="text-right">{m.issued}</td><td className="text-right">{money(m.value)}</td><td className={`text-right ${m.low ? 'font-extrabold text-bad' : ''}`}>{m.left}</td></tr>
                  ))}
                </Table>
              )}
            </Card>
            <Card>
              <Label className="mb-3">Stock added</Label>
              {!r.stockAdded.length ? <Empty>No stock added on this day.</Empty> : (
                <Table head={['Time', 'By', 'Medicine', 'Batch', { label: 'Qty', right: true }]}>
                  {r.stockAdded.map((s, i) => <tr key={i}><td className="text-muted">{s.time}</td><td>{s.user}</td><td>{s.medicine}</td><td>{s.batchNo}</td><td className="text-right">{s.qty}</td></tr>)}
                </Table>
              )}
            </Card>
          </div>
        </div>
      )}
    </>
  );
}
