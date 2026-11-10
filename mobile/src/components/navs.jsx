import { BottomNav } from './ui';

export const EmpNav = () => <BottomNav items={[
  { to: '/emp', end: true, icon: 'home', label: 'Home' },
  { to: '/emp/pick', icon: 'plus', label: 'Pick' },
  { to: '/emp/history', icon: 'list', label: 'History' },
]} />;

export const MgrNav = () => <BottomNav items={[
  { to: '/mgr', end: true, icon: 'box', label: 'Stock' },
  { to: '/mgr/add', icon: 'plus', label: 'Add' },
  { to: '/mgr/alerts', icon: 'alert', label: 'Alerts' },
]} />;

export const AdminNav = () => <BottomNav items={[
  { to: '/admin', end: true, icon: 'home', label: 'Today' },
  { to: '/admin/report', icon: 'doc', label: 'Report' },
  { to: '/admin/expiry', icon: 'alert', label: 'Expiry' },
  { to: '/admin/stock', icon: 'box', label: 'Stock' },
  { to: '/admin/team', icon: 'team', label: 'Team' },
]} />;
