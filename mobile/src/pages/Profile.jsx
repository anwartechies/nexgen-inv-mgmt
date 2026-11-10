import { useState } from 'react';
import { useAuth } from '../lib/auth';
import { api } from '../lib/api';
import { ROLE_LABEL } from '../lib/format';
import { Button, Card, ErrorBox, Field, Icon, Screen, Toast, TopBar, inputCls } from '../components/ui';

export default function Profile() {
  const { user, logout } = useAuth();
  const [oldPin, setOld] = useState('');
  const [newPin, setNew] = useState('');
  const [err, setErr] = useState('');
  const [toast, setToast] = useState('');

  const change = async (e) => {
    e.preventDefault(); setErr('');
    try {
      await api('/auth/change-pin', { method: 'POST', body: { oldPin, newPin } });
      setOld(''); setNew(''); setToast('PIN changed');
    } catch (x) { setErr(x.message); }
  };

  return (
    <Screen>
      <TopBar title="My account" />
      <div className="flex flex-col gap-4 p-5">
        <Card>
          <p className="m-0 text-lg font-extrabold">{user.name}</p>
          <p className="m-0 mt-1 text-sm text-muted">{ROLE_LABEL[user.role]} · {user.mobile}</p>
        </Card>
        <Card>
          <form className="flex flex-col gap-3" onSubmit={change}>
            <p className="m-0 font-bold">Change PIN</p>
            <Field label="Current PIN" id="op"><input id="op" className={inputCls} type="password" inputMode="numeric" maxLength={4} value={oldPin} onChange={(e) => setOld(e.target.value)} required /></Field>
            <Field label="New 4-digit PIN" id="np"><input id="np" className={inputCls} type="password" inputMode="numeric" maxLength={4} value={newPin} onChange={(e) => setNew(e.target.value.replace(/\D/g, ''))} required /></Field>
            <ErrorBox>{err}</ErrorBox>
            <Button variant="navy" type="submit">Save PIN</Button>
          </form>
        </Card>
        <Button variant="outline" onClick={logout}><Icon name="logout" size={20} />Log out</Button>
      </div>
      <Toast msg={toast} onDone={() => setToast('')} />
    </Screen>
  );
}
