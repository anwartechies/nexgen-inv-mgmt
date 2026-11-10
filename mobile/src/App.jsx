import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './lib/auth';
import Login from './pages/Login';
import Profile from './pages/Profile';
import EmpHome from './pages/employee/Home';
import EmpPick from './pages/employee/Pick';
import EmpHistory from './pages/employee/History';
import MgrStock from './pages/manager/Stock';
import MgrAdd from './pages/manager/AddStock';
import MgrAlerts from './pages/manager/Alerts';
import MedicineDetail from './pages/manager/MedicineDetail';
import AdminToday from './pages/admin/Today';
import AdminReport from './pages/admin/Report';
import AdminExpiry from './pages/admin/Expiry';
import AdminTeam from './pages/admin/Team';

const HOME = { employee: '/emp', manager: '/mgr', super_admin: '/admin' };

export default function App() {
  const { user } = useAuth();
  if (!user) {
    return (
      <Routes>
        <Route path="*" element={<Login />} />
      </Routes>
    );
  }
  const r = user.role;
  const staff = r === 'manager' || r === 'super_admin';
  return (
    <Routes>
      {r === 'employee' && <>
        <Route path="/emp" element={<EmpHome />} />
        <Route path="/emp/pick" element={<EmpPick />} />
        <Route path="/emp/history" element={<EmpHistory />} />
      </>}
      {staff && <>
        <Route path="/mgr" element={<MgrStock />} />
        <Route path="/mgr/add" element={<MgrAdd />} />
        <Route path="/mgr/alerts" element={<MgrAlerts />} />
        <Route path="/medicine/:id" element={<MedicineDetail />} />
      </>}
      {r === 'super_admin' && <>
        <Route path="/admin" element={<AdminToday />} />
        <Route path="/admin/report" element={<AdminReport />} />
        <Route path="/admin/expiry" element={<AdminExpiry />} />
        <Route path="/admin/stock" element={<MgrStock admin />} />
        <Route path="/admin/team" element={<AdminTeam />} />
      </>}
      <Route path="/profile" element={<Profile />} />
      <Route path="*" element={<Navigate to={HOME[r]} replace />} />
    </Routes>
  );
}
