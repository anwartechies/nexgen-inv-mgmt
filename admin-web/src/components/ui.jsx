import { useEffect } from 'react';

const P = {
  home: <path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />,
  box: <><path d="M21 8l-9-5-9 5 9 5 9-5z" /><path d="M3 8v8l9 5 9-5V8" /><path d="M12 13v8" /></>,
  alert: <><path d="M12 3l10 18H2z" /><path d="M12 10v5M12 18h.01" /></>,
  doc: <><path d="M6 3h9l4 4v14H6z" /><path d="M9 12h7M9 16h7" /></>,
  team: <><circle cx="9" cy="8" r="4" /><path d="M2 21c0-4 3-6 7-6s7 2 7 6" /><path d="M16 4a4 4 0 0 1 0 8M22 21c0-3-2-5-4-6" /></>,
  list: <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" /></>,
  log: <><path d="M12 8v4l3 2" /><circle cx="12" cy="12" r="9" /></>,
  add: <path d="M12 5v14M5 12h14" />,
  x: <path d="M18 6L6 18M6 6l12 12" />,
  logout: <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="M16 17l5-5-5-5M21 12H9" /></>,
  menu: <path d="M4 6h16M4 12h16M4 18h16" />,
  check: <path d="M20 6L9 17l-5-5" />,
  chev: <path d="M6 9l6 6 6-6" />,
};

export function Icon({ name, size = 20, stroke = 2, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke}
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>{P[name]}</svg>
  );
}

export const Card = ({ className = '', children, ...p }) => (
  <div className={`rounded-[18px] bg-white p-5 shadow-card ${className}`} {...p}>{children}</div>
);

export const Label = ({ className = '', children }) => (
  <p className={`m-0 text-xs font-semibold tracking-wide text-muted uppercase ${className}`}>{children}</p>
);

export function Button({ variant = 'gold', size = 'md', className = '', children, ...p }) {
  const v = {
    gold: 'bg-gold text-navy font-bold hover:brightness-105',
    navy: 'bg-navy text-gold font-bold',
    outline: 'border border-field bg-white text-navy font-semibold hover:bg-bg',
    danger: 'bg-bad-bg text-bad font-bold',
    ghost: 'text-navy font-semibold hover:bg-bg',
  }[variant];
  const s = size === 'sm' ? 'min-h-9 px-3 text-sm' : 'min-h-11 px-5 text-[15px]';
  return <button className={`inline-flex items-center justify-center gap-2 rounded-full whitespace-nowrap disabled:opacity-50 ${s} ${v} ${className}`} {...p}>{children}</button>;
}

export const Badge = ({ tone = 'warn', children }) => (
  <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold whitespace-nowrap ${tone === 'bad' ? 'bg-bad-bg text-bad' : tone === 'ok' ? 'bg-gold-soft text-gold-ink' : tone === 'muted' ? 'bg-line text-muted' : 'bg-warn-bg text-warn'}`}>{children}</span>
);

export const inputCls = 'h-11 w-full rounded-xl border border-field bg-white px-3.5 text-[15px] text-navy outline-none focus:border-gold focus:ring-2 focus:ring-gold/30';

export const Field = ({ label, id, children, className = '' }) => (
  <div className={`flex min-w-0 flex-1 flex-col gap-1.5 ${className}`}>
    <label htmlFor={id} className="text-[13px] font-semibold text-muted">{label}</label>
    {children}
  </div>
);

export const ErrorBox = ({ children }) => children ? <p role="alert" className="m-0 rounded-xl bg-bad-bg px-4 py-3 text-sm font-semibold text-bad">{children}</p> : null;
export const Empty = ({ children }) => <p className="m-0 py-8 text-center text-sm text-muted">{children}</p>;

export function PageHead({ title, sub, children }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="m-0 text-[26px] font-extrabold">{title}</h1>
        {sub && <p className="m-0 mt-1 text-sm text-muted">{sub}</p>}
      </div>
      <div className="flex flex-wrap items-center gap-2">{children}</div>
    </div>
  );
}

export function Modal({ title, onClose, children, wide }) {
  useEffect(() => {
    const k = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/40 p-4" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label={title} className={`max-h-[90vh] w-full overflow-y-auto rounded-3xl bg-white p-6 ${wide ? 'max-w-2xl' : 'max-w-md'}`} onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="m-0 text-lg font-extrabold">{title}</h2>
          <button type="button" aria-label="Close" onClick={onClose} className="flex size-10 items-center justify-center rounded-full hover:bg-bg"><Icon name="x" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Toast({ msg, onDone }) {
  useEffect(() => {
    if (!msg) return undefined;
    const t = setTimeout(onDone, 2500);
    return () => clearTimeout(t);
  }, [msg, onDone]);
  if (!msg) return null;
  return (
    <div role="status" className="fixed right-6 bottom-6 z-[60] flex items-center gap-2 rounded-full bg-navy px-5 py-3 text-sm font-semibold text-white shadow-lg">
      <Icon name="check" size={18} className="text-gold" />{msg}
    </div>
  );
}

export function Table({ head, children, className = '' }) {
  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>{head.map((h, i) => (
            <th key={i} className={`border-b border-line px-3 py-2.5 text-left text-xs font-semibold tracking-wide text-muted uppercase whitespace-nowrap ${h.right ? 'text-right' : ''}`}>{h.label ?? h}</th>
          ))}</tr>
        </thead>
        <tbody className="[&_td]:border-b [&_td]:border-line-2 [&_td]:px-3 [&_td]:py-2.5">{children}</tbody>
      </table>
    </div>
  );
}

export function Stat({ label, value, tone }) {
  const cls = tone === 'navy' ? 'bg-navy text-white' : tone === 'gold' ? 'bg-gold text-navy' : 'bg-white';
  return (
    <div className={`rounded-[18px] p-5 shadow-card ${cls}`}>
      <p className={`m-0 text-xs font-semibold tracking-wide uppercase ${tone === 'navy' ? 'text-gold-muted' : tone === 'gold' ? 'text-navy' : 'text-muted'}`}>{label}</p>
      <p className={`m-0 mt-2 text-[28px] font-extrabold ${tone === 'bad' ? 'text-bad' : ''}`}>{value}</p>
    </div>
  );
}
