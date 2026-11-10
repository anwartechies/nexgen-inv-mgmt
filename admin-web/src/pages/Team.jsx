import { useState } from 'react';
import { api } from '../lib/api';
import { useFetch } from '../lib/useFetch';
import { ROLE_LABEL, fmtDate } from '../lib/format';
import { Badge, Button, Card, ErrorBox, Field, Icon, Modal, PageHead, Table, Toast, inputCls } from '../components/ui';

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
    <>
      <PageHead title="Team" sub="Who can log in, with which role. Staff log in with mobile number + 4-digit PIN.">
        <Button onClick={() => { setErr(''); setF({ name: '', mobile: '', role: 'employee', pin: '', active: true }); }}><Icon name="add" size={18} />Add member</Button>
      </PageHead>
      <Card className="!p-2">
        <Table head={['Name', 'Mobile', 'Role', 'Status', 'Since', '']}>
          {data?.map((u) => (
            <tr key={u.id}>
              <td className="font-semibold">{u.name}</td><td>{u.mobile}</td><td><Badge tone="ok">{ROLE_LABEL[u.role]}</Badge></td>
              <td>{u.active ? 'Active' : <Badge tone="muted">Disabled</Badge>}</td><td className="text-muted">{fmtDate(u.createdAt)}</td>
              <td className="text-right"><Button size="sm" variant="ghost" onClick={() => { setErr(''); setF({ ...u, pin: '' }); }}>Edit</Button></td>
            </tr>
          ))}
        </Table>
      </Card>
      {f && (
        <Modal title={f.id ? `Edit ${f.name}` : 'New member'} onClose={() => setF(null)}>
          <form className="flex flex-col gap-3" onSubmit={save}>
            <Field label="Name" id="tn"><input id="tn" className={inputCls} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} required /></Field>
            <Field label="Mobile number" id="tm"><input id="tm" type="tel" className={inputCls} value={f.mobile} onChange={(e) => setF({ ...f, mobile: e.target.value })} required /></Field>
            <Field label="Role" id="tr">
              <select id="tr" className={inputCls} value={f.role} onChange={(e) => setF({ ...f, role: e.target.value })}>
                {Object.entries(ROLE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </Field>
            <Field label={f.id ? 'Reset PIN (blank keeps current)' : '4-digit PIN'} id="tp">
              <input id="tp" inputMode="numeric" maxLength={4} className={inputCls} value={f.pin} onChange={(e) => setF({ ...f, pin: e.target.value.replace(/\D/g, '') })} required={!f.id} />
            </Field>
            {f.id && (
              <label className="flex min-h-11 items-center gap-3 font-semibold">
                <input type="checkbox" className="size-5 accent-gold" checked={f.active} onChange={(e) => setF({ ...f, active: e.target.checked })} />Active (can log in)
              </label>
            )}
            <ErrorBox>{err}</ErrorBox>
            <Button type="submit">Save</Button>
          </form>
        </Modal>
      )}
      <Toast msg={toast} onDone={() => setToast('')} />
    </>
  );
}
