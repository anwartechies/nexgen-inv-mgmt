import { useFetch } from '../../lib/useFetch';
import { Empty, Label, Loading, Screen, TopBar } from '../../components/ui';
import { MgrNav } from '../../components/navs';
import { MedRow } from './Stock';

export default function Alerts() {
  const low = useFetch('/medicines?filter=low');
  const exp = useFetch('/medicines?filter=expiring');
  return (
    <Screen nav={<MgrNav />}>
      <TopBar title="Alerts" back={false} />
      <div className="flex flex-col gap-2.5 px-5 py-4">
        <Label>Low stock — reorder</Label>
        {low.loading && <Loading />}
        {low.data && !low.data.length && <Empty>Nothing is low.</Empty>}
        {low.data?.map((m) => <MedRow key={m.id} m={m} />)}
        <Label className="mt-4">Expired or expiring in 30 days</Label>
        {exp.data && !exp.data.length && <Empty>No expiry alerts.</Empty>}
        {exp.data?.map((m) => <MedRow key={m.id} m={m} />)}
      </div>
    </Screen>
  );
}
