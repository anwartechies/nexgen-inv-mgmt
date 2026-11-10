import { useState } from 'react';
import { useAuth } from '../lib/auth';
import { Button, ErrorBox, Field, Icon, inputCls } from '../components/ui';

export default function Login() {
  const { login } = useAuth();
  const [mobile, setMobile] = useState('');
  const [pin, setPin] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault(); setErr(''); setBusy(true);
    try { await login(mobile, pin); } catch (x) { setErr(x.message); } finally { setBusy(false); }
  };
  return (
    <div className="grid min-h-full lg:grid-cols-2">
      <div className="hidden flex-col justify-between bg-navy p-12 text-white lg:flex">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-gold text-navy"><Icon name="box" size={28} /></div>
        <div>
          <h2 className="m-0 text-4xl leading-tight font-extrabold">Every vial, every batch,<br />every pickup — in one place.</h2>
          <p className="m-0 mt-4 text-gold-muted">Reports, expiry watch, stock and team for the Super Admin.</p>
        </div>
        <p className="m-0 text-sm text-white/60">NexGen Inventory</p>
      </div>
      <div className="flex items-center justify-center p-6">
        <form onSubmit={submit} className="flex w-full max-w-sm flex-col gap-5">
          <div>
            <h1 className="m-0 text-[28px] font-extrabold">Admin console</h1>
            <p className="m-0 mt-2 text-muted">Log in with your mobile number and PIN.</p>
          </div>
          <Field label="Mobile number" id="m"><input id="m" className={`${inputCls} h-12`} type="tel" autoComplete="username" value={mobile} onChange={(e) => setMobile(e.target.value)} required /></Field>
          <Field label="4-digit PIN" id="p"><input id="p" className={`${inputCls} h-12 tracking-[8px]`} type="password" inputMode="numeric" maxLength={4} autoComplete="current-password" value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))} required /></Field>
          <ErrorBox>{err}</ErrorBox>
          <Button type="submit" className="min-h-12" disabled={busy}>{busy ? 'Logging in…' : 'Log in'}</Button>
        </form>
      </div>
    </div>
  );
}
