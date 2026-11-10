import { useState } from 'react';
import { useFetch } from '../../lib/useFetch';
import { fmtTime, todayISO } from '../../lib/format';
import { Card, Empty, Label, Loading, Screen, TopBar, inputCls } from '../../components/ui';
import { EmpNav } from '../../components/navs';

export default function History() {
  const [date, setDate] = useState(todayISO());
  const { data, loading } = useFetch(`/visits?mine=1&date=${date}`);
  return (
    <Screen nav={<EmpNav />}>
      <TopBar title="My history" back={false} />
      <div className="flex flex-col gap-3 px-5 py-4">
        <label htmlFor="d" className="sr-only">Date</label>
        <input id="d" type="date" className={inputCls} value={date} max={todayISO()} onChange={(e) => setDate(e.target.value)} />
        {loading && <Loading />}
        {data && !data.length && <Empty>No pickups on this day.</Empty>}
        {data?.map((v) => (
          <Card key={v.id}>
            <div className="flex justify-between"><Label>Visit · {fmtTime(v.createdAt)}</Label><span className="text-[13px] text-muted">{v.Patient?.name} · {v.Patient?.code}</span></div>
            {v.items.map((it) => (
              <div key={it.id} className="mt-2 flex justify-between border-t border-line-2 pt-2 text-[15px]">
                <span className="font-semibold">{it.Medicine.name}</span>
                <span className="text-muted">× {it.qty} · {it.Batch?.batchNo}</span>
              </div>
            ))}
          </Card>
        ))}
      </div>
    </Screen>
  );
}
