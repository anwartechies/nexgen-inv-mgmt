import { useFetch } from '../lib/useFetch';
import { fmtDate, fmtTime } from '../lib/format';
import { Badge, Card, Empty, PageHead, Table } from '../components/ui';

const TYPE = { add: ['Added', 'ok'], adjust: ['Count fix', 'warn'], return: ['Returned', 'muted'], dispose: ['Disposed', 'bad'] };

export default function StockLog() {
  const { data } = useFetch('/stock-entries?limit=300');
  return (
    <>
      <PageHead title="Stock log" sub="Every stock receipt, count correction, return and disposal." />
      <Card className="!p-2">
        {data && !data.length ? <Empty>No entries yet.</Empty> : (
          <Table head={['When', 'By', 'Type', 'Medicine', 'Batch', { label: 'Qty', right: true }, 'Note']}>
            {data?.map((s) => (
              <tr key={s.id}>
                <td className="whitespace-nowrap text-muted">{fmtDate(s.createdAt)} · {fmtTime(s.createdAt)}</td>
                <td className="font-semibold">{s.User?.name}</td>
                <td><Badge tone={TYPE[s.type][1]}>{TYPE[s.type][0]}</Badge></td>
                <td>{s.Batch?.Medicine?.name}</td>
                <td>{s.Batch?.batchNo}</td>
                <td className={`text-right font-semibold ${s.qty < 0 ? 'text-bad' : ''}`}>{s.qty > 0 ? `+${s.qty}` : s.qty}</td>
                <td className="text-muted">{s.note}</td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
    </>
  );
}
