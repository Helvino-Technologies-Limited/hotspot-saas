import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import LoadingSpinner from './components/LoadingSpinner';

import Landing from './pages/Landing';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Packages from './pages/Packages';
import Vouchers from './pages/Vouchers';
import Payments from './pages/Payments';
import Sessions from './pages/Sessions';
import Routers from './pages/Routers';
import Settings from './pages/Settings';
import CaptivePortal from './pages/CaptivePortal';
import SuperDashboard from './pages/superadmin/SuperDashboard';
import Tenants from './pages/superadmin/Tenants';

const PrivateRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner fullScreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return <Layout>{children}</Layout>;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner fullScreen />;
  if (user) return <Navigate to={user.role === 'superadmin' ? '/superadmin' : '/dashboard'} replace />;
  return children;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/portal/:tenantSlug" element={<CaptivePortal />} />

      {/* Admin Routes */}
      <Route path="/dashboard" element={<PrivateRoute roles={['admin','staff']}><Dashboard /></PrivateRoute>} />
      <Route path="/packages" element={<PrivateRoute roles={['admin','staff']}><Packages /></PrivateRoute>} />
      <Route path="/vouchers" element={<PrivateRoute roles={['admin','staff']}><Vouchers /></PrivateRoute>} />
      <Route path="/payments" element={<PrivateRoute roles={['admin','staff']}><Payments /></PrivateRoute>} />
      <Route path="/sessions" element={<PrivateRoute roles={['admin','staff']}><Sessions /></PrivateRoute>} />
      <Route path="/routers" element={<PrivateRoute roles={['admin']}><Routers /></PrivateRoute>} />
      <Route path="/settings" element={<PrivateRoute roles={['admin','staff']}><Settings /></PrivateRoute>} />

      {/* Super Admin Routes */}
      <Route path="/superadmin" element={<PrivateRoute roles={['superadmin']}><SuperDashboard /></PrivateRoute>} />
      <Route path="/superadmin/tenants" element={<PrivateRoute roles={['superadmin']}><Tenants /></PrivateRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster position="top-right" toastOptions={{
          style: { background: '#1e293b', color: '#f1f5f9', border: '1px solid #334155', borderRadius: '12px' },
          success: { iconTheme: { primary: '#10b981', secondary: '#1e293b' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#1e293b' } },
        }} />
      </AuthProvider>
    </BrowserRouter>
  );
}
