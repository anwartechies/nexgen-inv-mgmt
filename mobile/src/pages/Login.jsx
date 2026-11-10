import { useState } from 'react';
import { useAuth } from '../lib/auth';
import { Button, ErrorBox, Icon, inputCls } from '../components/ui';

export default function Login() {
  const { login } = useAuth();
  const [mobile, setMobile] = useState('');
  const [pin, setPin] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setErr(''); setBusy(true);
    try { await login(mobile, pin); } catch (x) { setErr(x.message); } finally { setBusy(false); }
  };

  return (
    <div className="mx-auto flex min-h-full max-w-md flex-col gap-7 px-7 pt-[72px] pb-8">
      <div className="flex flex-col gap-3.5">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-navy text-gold"><Icon name="box" size={28} /></div>
        <h1 className="m-0 text-[28px] leading-tight font-bold">NexGen Inventory</h1>
        <p className="m-0 text-[15px] leading-normal text-muted">Log in with your mobile number. You will see only the screens for your role.</p>
      </div>
      <form className="flex flex-col gap-[18px]" onSubmit={submit}>
        <div className="flex flex-col gap-2">
          <label className="text-[13px] font-semibold text-muted" htmlFor="mob">Mobile number</label>
          <input className={`${inputCls} h-[52px]`} id="mob" type="tel" inputMode="numeric" autoComplete="username"
            placeholder="98XXX XXXXX" value={mobile} onChange={(e) => setMobile(e.target.value)} required />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-[13px] font-semibold text-muted" htmlFor="pin">4-digit PIN</label>
          <input className={`${inputCls} h-[52px] tracking-[8px]`} id="pin" type="password" inputMode="numeric" maxLength={4}
            autoComplete="current-password" value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))} required />
        </div>
        <ErrorBox>{err}</ErrorBox>
        <Button type="submit" disabled={busy}>{busy ? 'Logging in…' : 'Log in'}</Button>
        <p className="m-0 text-center text-sm font-medium">Forgot PIN? Ask the clinic admin</p>
      </form>
      <div className="mt-auto flex flex-col gap-2.5 rounded-[14px] border border-line bg-white px-4 py-3.5">
        <span className="text-[13px] font-semibold text-muted">One app, three roles</span>
        <div className="flex flex-wrap gap-2 text-[13px] font-semibold">
          {['Super Admin', 'Manager', 'Employee'].map((r) => <span key={r} className="rounded-full bg-gold-soft px-2.5 py-1.5 text-gold-ink">{r}</span>)}
        </div>
      </div>
    </div>
  );
}
