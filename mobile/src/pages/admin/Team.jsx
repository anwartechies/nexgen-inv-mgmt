import { useState } from 'react';
import { api } from '../../lib/api';
import { useFetch } from '../../lib/useFetch';
import { ROLE_LABEL } from '../../lib/format';
import { Button, Card, ErrorBox, Field, Icon, Loading, Screen, Sheet, Toast, TopBar, inputCls } from '../../components/ui';
import { AdminNav } from '../../components/navs';

export default function Team() {
  const { data, reload } = useFetch('/users');
  const [f, setF] = useState(null);
  const [err, setErr] = useState('');
  const [toast, setToast] = useState('');

  const save = async (e) => {
    e.preventDefault(); setErr('');
    try {
      if (f.id) await api(`/users/${f.id}`, { method: 'PATCH', body: { name: f.name, mobile: f.mobile, role: f.role, active: f.active, pin: f.pin || undefined } });
      else await api('/users', { method: 'POST', body: f });
      setF(null); setToast('Saved'); reload();
    } catch (x) { setErr(x.message); }
  };

  return (
    <Screen nav={<AdminNav />}>
      <TopBar title="Team" back={false} right={
        <button type="button" onClick={() => { setErr(''); setF({ name: '', mobile: '', role: 'employee', pin: '', active: true }); }} className="flex min-h-11 items-center gap-1 rounded-full bg-gold px-4 text-sm font-bold">
          <Icon name="add" size={18} />Add
        </button>
      } />
      <div className="flex flex-col gap-2.5 px-5 py-4">
        {!data && <Loading />}
        {data?.map((u) => (
          <button key={u.id} type="button" onClick={() => { setErr(''); setF({ ...u, pin: '' }); }} className="text-left">
            <Card className={`flex items-center justify-between ${u.active ? '' : 'opacity-50'}`}>
              <div><p className="m-0 font-semibold">{u.name}</p><p className="m-0 mt-0.5 text-[13px] text-muted">{u.mobile}</p></div>
              <span className="rounded-full bg-gold-soft px-2.5 py-1 text-xs font-semibold text-gold-ink">{u.active ? ROLE_LABEL[u.role] : 'Disabled'}</span>
            </Card>
          </button>
        ))}
      </div>
      {f && (
        <Sheet title={f.id ? 'Edit member' : 'New member'} onClose={() => setF(null)}>
          <form className="flex flex-col gap-3" onSubmit={save}>
            <Field label="Name" id="tn"><input id="tn" className={inputCls} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} required /></Field>
            <Field label="Mobile number" id="tm"><input id="tm" className={inputCls} type="tel" value={f.mobile} onChange={(e) => setF({ ...f, mobile: e.target.value })} required /></Field>
            <Field label="Role" id="tr">
              <select id="tr" className={inputCls} value={f.role} onChange={(e) => setF({ ...f, role: e.target.value })}>
                {Object.entries(ROLE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </Field>
            <Field label={f.id ? 'Reset PIN (leave blank to keep)' : '4-digit PIN'} id="tp">
              <input id="tp" className={inputCls} inputMode="numeric" maxLength={4} value={f.pin} onChange={(e) => setF({ ...f, pin: e.target.value.replace(/\D/g, '') })} required={!f.id} />
            </Field>
            {f.id && (
              <label className="flex min-h-11 items-center gap-3 text-[15px] font-semibold">
                <input type="checkbox" className="size-5 accent-gold" checked={f.active} onChange={(e) => setF({ ...f, active: e.target.checked })} />Active (can log in)
              </label>
            )}
            <ErrorBox>{err}</ErrorBox>
            <Button type="submit">Save</Button>
          </form>
        </Sheet>
      )}
      <Toast msg={toast} onDone={() => setToast('')} />
    </Screen>
  );
}
