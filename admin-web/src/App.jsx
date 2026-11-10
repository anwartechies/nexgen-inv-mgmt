import { useState } from 'react';
import { Navigate, NavLink, Route, Routes } from 'react-router-dom';
import { useAuth } from './lib/auth';
import { Icon } from './components/ui';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Report from './pages/Report';
import Expiry from './pages/Expiry';
import Inventory from './pages/Inventory';
import Pickups from './pages/Pickups';
import StockLog from './pages/StockLog';
import Team from './pages/Team';
import Patients from './pages/Patients';

const NAV = [
  { to: '/', icon: 'home', label: 'Dashboard', end: true },
  { to: '/report', icon: 'doc', label: 'EOD report' },
  { to: '/expiry', icon: 'alert', label: 'Expiry watch' },
  { to: '/inventory', icon: 'box', label: 'Inventory' },
  { to: '/pickups', icon: 'list', label: 'Pickups' },
  { to: '/stock-log', icon: 'log', label: 'Stock log' },
  { to: '/patients', icon: 'user', label: 'Patients' },
  { to: '/team', icon: 'team', label: 'Team' },
];

export default function App() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  if (!user) return <Login />;
  if (user.role !== 'super_admin') {
    return (
      <div className="flex min-h-full flex-col items-center justify-center gap-4 p-6 text-center">
        <h1 className="m-0 text-2xl font-extrabold">This console is for the Super Admin</h1>
        <p className="m-0 text-muted">{user.name}, please use the NexGen mobile app for your role.</p>
        <button type="button" className="min-h-11 rounded-full bg-gold px-5 font-bold" onClick={logout}>Log out</button>
      </div>
    );
  }

  return (
    <div className="flex min-h-full">
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-navy text-white transition-transform lg:static lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center gap-3 px-6 py-6">
          <div className="flex size-10 items-center justify-center rounded-xl bg-gold text-navy"><Icon name="box" size={22} /></div>
          <div><p className="m-0 font-extrabold">NexGen</p><p className="m-0 text-xs text-gold-muted">Admin console</p></div>
        </div>
        <nav className="flex flex-1 flex-col gap-1 px-3">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end} onClick={() => setOpen(false)}
              className={({ isActive }) => `flex min-h-11 items-center gap-3 rounded-xl px-3 text-[15px] no-underline ${isActive ? 'bg-gold font-bold text-navy' : 'text-white/80 hover:bg-white/10'}`}>
              <Icon name={n.icon} />{n.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-white/10 p-4">
          <p className="m-0 text-sm font-bold">{user.name}</p>
          <p className="m-0 text-xs text-gold-muted">{user.mobile}</p>
          <button type="button" onClick={logout} className="mt-3 flex min-h-10 items-center gap-2 text-sm text-white/80 hover:text-white"><Icon name="logout" size={18} />Log out</button>
        </div>
      </aside>
      {open && <div className="fixed inset-0 z-30 bg-navy/40 lg:hidden" onClick={() => setOpen(false)} />}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b border-line bg-white px-4 py-3 lg:hidden">
          <button type="button" aria-label="Open menu" onClick={() => setOpen(true)} className="flex size-11 items-center justify-center"><Icon name="menu" /></button>
          <span className="font-extrabold">NexGen Admin</span>
        </header>
        <main className="mx-auto w-full max-w-7xl flex-1 p-4 sm:p-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/report" element={<Report />} />
            <Route path="/expiry" element={<Expiry />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/pickups" element={<Pickups />} />
            <Route path="/stock-log" element={<StockLog />} />
            <Route path="/patients" element={<Patients />} />
            <Route path="/team" element={<Team />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
