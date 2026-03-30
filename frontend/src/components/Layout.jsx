import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard, Package, Ticket, CreditCard, Activity, Router,
  Users, Settings, LogOut, Menu, X, Wifi, ChevronRight, Bell,
  Shield, BarChart3, Building2, BookOpen
} from 'lucide-react';
import clsx from 'clsx';

const NavLink = ({ to, icon: Icon, label, onClick }) => {
  const { pathname } = useLocation();
  const active = pathname === to || (to !== '/dashboard' && pathname.startsWith(to));
  return (
    <Link to={to} onClick={onClick} className={active ? 'sidebar-link-active' : 'sidebar-link'}>
      <Icon size={18} />
      <span>{label}</span>
      {active && <ChevronRight size={14} className="ml-auto opacity-60" />}
    </Link>
  );
};

export default function Layout({ children }) {
  const { user, logout, isSuperAdmin } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const adminLinks = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/packages', icon: Package, label: 'Packages' },
    { to: '/vouchers', icon: Ticket, label: 'Vouchers' },
    { to: '/payments', icon: CreditCard, label: 'Payments' },
    { to: '/sessions', icon: Activity, label: 'Sessions' },
    { to: '/routers', icon: Router, label: 'Routers' },
    { to: '/settings', icon: Settings, label: 'Settings' },
    { to: '/manual', icon: BookOpen, label: 'User Manual' },
  ];

  const superAdminLinks = [
    { to: '/superadmin', icon: LayoutDashboard, label: 'Overview' },
    { to: '/superadmin/tenants', icon: Building2, label: 'Tenants' },
    { to: '/superadmin/manual', icon: BookOpen, label: 'User Manual' },
  ];

  const links = isSuperAdmin ? superAdminLinks : adminLinks;

  const handleLogout = () => { logout(); navigate('/login'); };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-brand-500 rounded-xl flex items-center justify-center shadow-lg shadow-brand-500/25">
            <Wifi size={18} className="text-white" />
          </div>
          <div>
            <div className="font-bold text-slate-100 text-sm leading-none">HOTSPOT</div>
            <div className="text-xs text-brand-400 font-semibold">SaaS</div>
          </div>
        </div>
      </div>

      {/* User info */}
      <div className="px-4 py-4 border-b border-slate-800">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50">
          <div className="w-8 h-8 rounded-lg bg-brand-500/20 border border-brand-500/30 flex items-center justify-center">
            <span className="text-brand-400 font-bold text-xs">{user?.username?.[0]?.toUpperCase()}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-slate-200 truncate">{user?.username}</div>
            <div className="text-xs text-slate-500 truncate">{user?.tenantName || 'System Admin'}</div>
          </div>
          {isSuperAdmin && <Shield size={14} className="text-brand-400 flex-shrink-0" />}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        <div className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-3 px-4">
          {isSuperAdmin ? 'Administration' : 'Management'}
        </div>
        {links.map(l => (
          <NavLink key={l.to} {...l} onClick={() => setSidebarOpen(false)} />
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-800 space-y-1">
        <button onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200 font-medium text-sm">
          <LogOut size={18} />
          <span>Sign Out</span>
        </button>
        <div className="px-4 pt-2">
          <div className="text-xs text-slate-600">Powered by</div>
          <a href="https://helvino.org" target="_blank" rel="noreferrer" className="text-xs text-brand-600 hover:text-brand-400 transition-colors">Helvino Technologies</a>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-slate-950 border-r border-slate-800 flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <aside className="relative flex flex-col w-64 bg-slate-950 border-r border-slate-800 h-full z-10">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="h-16 border-b border-slate-800 bg-slate-950/80 backdrop-blur-sm flex items-center justify-between px-6 flex-shrink-0">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-slate-400 hover:text-slate-200 transition-colors">
              <Menu size={20} />
            </button>
            {user?.isImpersonated && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-400">
                <Shield size={12} />
                Impersonating {user.tenantName}
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button className="text-slate-500 hover:text-slate-300 transition-colors relative">
              <Bell size={20} />
            </button>
            <div className="hidden sm:flex items-center gap-2 text-sm">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-slate-500">{user?.role === 'superadmin' ? 'Super Admin' : user?.tenantName}</span>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-6 animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
