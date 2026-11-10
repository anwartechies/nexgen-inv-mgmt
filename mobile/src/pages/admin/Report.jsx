import { useState } from 'react';
import { download } from '../../lib/api';
import { useFetch } from '../../lib/useFetch';
import { money, todayISO } from '../../lib/format';
import { Card, DarkHeader, Empty, Label, Loading, Screen } from '../../components/ui';
import { AdminNav } from '../../components/navs';

export function whatsappText(r) {
  const lines = [
    `*NexGen EOD report — ${r.date}*`,
    `Items issued: ${r.itemsIssued} · Staff: ${r.staffCount} · Sold: ${money(r.soldValue)}`,
    `Low stock: ${r.lowStock} · Expiring (30d): ${r.expiring30} · Expired: ${r.expiredBatches}`,
    '',
    '*By employee*',
    ...r.byEmployee.map((e) => `${e.name}: ${e.items} items, ${e.visits} visits`),
    '',
    '*By medicine*',
    ...r.byMedicine.map((m) => `${m.name}: issued ${m.issued}, left ${m.left}${m.low ? ' ⚠' : ''}`),
  ];
  if (r.stockAdded.length) lines.push('', '*Stock added*', ...r.stockAdded.map((s) => `${s.user}: ${s.medicine} × ${s.qty} (${s.batchNo})`));
  return lines.join('\n');
}

export default function Report() {
  const [date, setDate] = useState(todayISO());
  const [open, setOpen] = useState(null);
  const { data: r, loading } = useFetch(`/reports/eod?date=${date}`);
  const sb = 'min-h-[46px] rounded-full bg-gold px-4 text-sm font-bold text-navy';

  return (
    <Screen nav={<AdminNav />}>
      <DarkHeader className="flex flex-col gap-3">
        <h1 className="m-0 text-[22px] font-extrabold">End-of-day report</h1>
        <div className="flex gap-2">
          <label htmlFor="d" className="sr-only">Date</label>
          <input id="d" type="date" value={date} max={todayISO()} onChange={(e) => setDate(e.target.value)} className="h-[46px] min-w-0 flex-1 rounded-full bg-white px-3.5 text-[15px] text-navy" />
          <button type="button" className={sb} onClick={() => download(`/reports/eod.pdf?date=${date}`, `EOD-${date}.pdf`)}>PDF</button>
          <a className={`${sb} flex items-center no-underline`} target="_blank" rel="noreferrer"
            href={r ? `https://wa.me/?text=${encodeURIComponent(whatsappText(r))}` : undefined}>WhatsApp</a>
        </div>
      </DarkHeader>
      {loading && !r && <Loading />}
      {r && (
        <div className="flex flex-col gap-3.5 px-5 py-4">
          <Card className="flex justify-between !bg-navy text-white">
            <div><Label className="!text-gold-muted">Items issued</Label><p className="m-0 mt-1 text-[22px] font-extrabold">{r.itemsIssued}</p></div>
            <div><Label className="!text-gold-muted">Staff</Label><p className="m-0 mt-1 text-[22px] font-extrabold">{r.staffCount}</p></div>
            <div><Label className="!text-gold-muted">Sold value</Label><p className="m-0 mt-1 text-[22px] font-extrabold">{money(r.soldValue)}</p></div>
          </Card>
          <Card>
            <Label className="mb-2.5">By employee</Label>
            {!r.byEmployee.length && <Empty>No pickups on this day.</Empty>}
            {r.byEmployee.map((e) => (
              <div key={e.userId} className="mb-3">
                <button type="button" onClick={() => setOpen(open === e.userId ? null : e.userId)} className="flex w-full items-baseline justify-between text-left">
                  <span className="text-base font-extrabold">{e.name}</span><span className="text-sm font-semibold">{e.items} items</span>
                </button>
                <p className="m-0 mt-1 text-xs text-muted">Visits: {e.visitTimes.join(' · ')}</p>
                {open === e.userId && (
                  <table className="mt-2 w-full border-collapse text-sm">
                    <thead><tr className="text-left text-xs text-muted"><th className="border-b border-line py-2 font-semibold">Medicine</th><th className="border-b border-line py-2 font-semibold">Patient</th><th className="border-b border-line py-2 text-right font-semibold">Qty</th></tr></thead>
                    <tbody>{e.lines.map((l, i) => <tr key={i}><td className="border-b border-line-2 py-2">{l.medicine}</td><td className="border-b border-line-2 py-2">{l.patient}</td><td className="border-b border-line-2 py-2 text-right">{l.qty}</td></tr>)}</tbody>
                  </table>
                )}
              </div>
            ))}
            {r.byEmployee.length > 0 && <p className="m-0 text-sm font-semibold">Tap a name to see full list</p>}
          </Card>
          <Card>
            <Label className="mb-1.5">By medicine</Label>
            <table className="w-full border-collapse text-sm">
              <thead><tr className="text-left text-xs text-muted"><th className="border-b border-line py-2 font-semibold">Medicine</th><th className="border-b border-line py-2 text-right font-semibold">Issued</th><th className="border-b border-line py-2 text-right font-semibold">Left</th></tr></thead>
              <tbody>{r.byMedicine.map((m) => (
                <tr key={m.medicineId}><td className="border-b border-line-2 py-2">{m.name}</td><td className="border-b border-line-2 py-2 text-right">{m.issued}</td>
                  <td className={`border-b border-line-2 py-2 text-right ${m.low ? 'font-extrabold text-bad' : ''}`}>{m.left}</td></tr>
              ))}</tbody>
            </table>
            {!r.byMedicine.length && <Empty>Nothing issued.</Empty>}
          </Card>
          <Card>
            <Label className="mb-1.5">Stock added</Label>
            {!r.stockAdded.length && <Empty>No stock added on this day.</Empty>}
            {r.stockAdded.map((s, i) => <p key={i} className="m-0 text-sm leading-normal">{s.user}: {s.medicine} × {s.qty} (batch {s.batchNo}) · {s.time}</p>)}
          </Card>
        </div>
      )}
    </Screen>
  );
}
