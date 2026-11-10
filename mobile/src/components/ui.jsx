import { useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';

const P = {
  home: <path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />,
  plus: <><circle cx="12" cy="12" r="9" /><path d="M12 8v8M8 12h8" /></>,
  list: <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />,
  box: <><path d="M21 8l-9-5-9 5 9 5 9-5z" /><path d="M3 8v8l9 5 9-5V8" /><path d="M12 13v8" /></>,
  alert: <><path d="M12 3l10 18H2z" /><path d="M12 10v5M12 18h.01" /></>,
  doc: <><path d="M6 3h9l4 4v14H6z" /><path d="M9 12h7M9 16h7" /></>,
  team: <><circle cx="9" cy="8" r="4" /><path d="M2 21c0-4 3-6 7-6s7 2 7 6" /><path d="M16 4a4 4 0 0 1 0 8M22 21c0-3-2-5-4-6" /></>,
  back: <path d="M15 18l-6-6 6-6" />,
  add: <path d="M12 5v14M5 12h14" />,
  logout: <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="M16 17l5-5-5-5M21 12H9" /></>,
  x: <path d="M18 6L6 18M6 6l12 12" />,
  check: <path d="M20 6L9 17l-5-5" />,
  chev: <path d="M9 18l6-6-6-6" />,
};

export function Icon({ name, size = 22, stroke = 2, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke}
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>{P[name]}</svg>
  );
}

export function Screen({ children, nav }) {
  return (
    <div className="mx-auto flex h-full max-w-md flex-col bg-bg">
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">{children}</div>
      {nav}
    </div>
  );
}

export function BottomNav({ items }) {
  return (
    <nav className="flex border-t border-line bg-white px-2 pt-2 pb-[max(14px,env(safe-area-inset-bottom))]">
      {items.map((it) => (
        <NavLink key={it.to} to={it.to} end={it.end}
          className={({ isActive }) => `flex min-h-11 flex-1 flex-col items-center gap-1 py-1.5 text-xs no-underline ${isActive ? 'font-extrabold text-navy shadow-[inset_0_3px_0_var(--color-gold)]' : 'font-medium text-muted'}`}>
          <Icon name={it.icon} />{it.label}
        </NavLink>
      ))}
    </nav>
  );
}

export function TopBar({ title, back = true, right }) {
  const nav = useNavigate();
  return (
    <header className="sticky top-0 z-10 flex items-center gap-2.5 border-b border-line bg-white px-5 pt-5 pb-3.5">
      {back && (
        <button type="button" aria-label="Back" onClick={() => nav(-1)} className="-ml-3 flex size-11 items-center justify-center">
          <Icon name="back" />
        </button>
      )}
      <h1 className="m-0 flex-1 text-xl font-extrabold">{title}</h1>
      {right}
    </header>
  );
}

export function DarkHeader({ children, className = '' }) {
  return <header className={`rounded-b-3xl bg-navy px-5 pt-7 pb-5 text-white ${className}`}>{children}</header>;
}

export const Card = ({ className = '', children, ...p }) => (
  <div className={`rounded-[18px] bg-white px-4 py-3.5 shadow-card ${className}`} {...p}>{children}</div>
);

export const Label = ({ className = '', children, ...p }) => (
  <p className={`m-0 text-xs font-semibold tracking-wide text-muted uppercase ${className}`} {...p}>{children}</p>
);

export function Button({ variant = 'gold', className = '', children, ...p }) {
  const v = {
    gold: 'bg-gold text-navy font-bold',
    outline: 'border border-field bg-white text-navy font-semibold',
    navy: 'bg-navy text-gold font-bold',
    danger: 'bg-bad-bg text-bad font-bold',
  }[variant];
  return (
    <button className={`flex min-h-[54px] w-full items-center justify-center gap-2 rounded-full border-0 px-5 text-base disabled:opacity-50 ${v} ${className}`} {...p}>
      {children}
    </button>
  );
}

export const Badge = ({ tone = 'warn', children }) => (
  <span className={`inline-block rounded-full px-2 py-1 text-xs font-semibold whitespace-nowrap ${tone === 'bad' ? 'bg-bad-bg text-bad' : tone === 'ok' ? 'bg-gold-soft text-gold-ink' : 'bg-warn-bg text-warn'}`}>{children}</span>
);

export const Field = ({ label, id, children, className = '' }) => (
  <div className={`flex min-w-0 flex-1 flex-col gap-1.5 ${className}`}>
    <label htmlFor={id} className="text-[13px] font-semibold text-muted">{label}</label>
    {children}
  </div>
);

export const inputCls = 'h-12 w-full rounded-xl border border-field bg-white px-3.5 text-base text-navy outline-none focus:border-gold focus:ring-2 focus:ring-gold/30';

export const ErrorBox = ({ children }) => children ? <p role="alert" className="m-0 rounded-xl bg-bad-bg px-4 py-3 text-sm font-semibold text-bad">{children}</p> : null;

export const Loading = () => <p className="p-6 text-center text-sm text-muted">Loading…</p>;

export const Empty = ({ children }) => <p className="m-0 py-6 text-center text-sm text-muted">{children}</p>;

export function Toast({ msg, onDone }) {
  useEffect(() => {
    if (!msg) return undefined;
    const t = setTimeout(onDone, 2500);
    return () => clearTimeout(t);
  }, [msg, onDone]);
  if (!msg) return null;
  return (
    <div role="status" className="fixed inset-x-0 bottom-28 z-50 mx-auto flex w-fit items-center gap-2 rounded-full bg-navy px-5 py-3 text-sm font-semibold text-white shadow-lg">
      <Icon name="check" size={18} className="text-gold" />{msg}
    </div>
  );
}

export function Sheet({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-navy/40" onClick={onClose}>
      <div className="max-h-[90%] w-full max-w-md overflow-y-auto rounded-t-3xl bg-white p-5 pb-8" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="m-0 text-lg font-extrabold">{title}</h2>
          <button type="button" aria-label="Close" onClick={onClose} className="flex size-11 items-center justify-center"><Icon name="x" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}
