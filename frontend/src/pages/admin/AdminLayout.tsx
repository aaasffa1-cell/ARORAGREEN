import React from 'react';
import { NavLink, Outlet, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Trophy,
  ClipboardList,
  Users,
  CreditCard,
  UserCheck,
  Calendar,
  KeyRound,
  Award,
  Bell,
  Settings,
  ShieldAlert,
  History,
} from 'lucide-react';

export const AdminLayout: React.FC = () => {
  const { user, loading, isAdmin } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center text-subtext text-sm">
        Verifying administrator authorization...
      </div>
    );
  }

  // Not logged in -> Immediately redirect to login, preserving destination URL
  if (!user) {
    const targetUrl = location.pathname + location.search;
    return <Navigate to={`/login?redirect=${encodeURIComponent(targetUrl)}`} replace />;
  }

  if (!isAdmin) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center space-y-6">
        <div className="w-16 h-16 bg-deepteal border border-rose-500/50 rounded-2xl flex items-center justify-center mx-auto text-rose-400">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h1 className="font-heading text-3xl font-extrabold uppercase text-icewhite">
          Access Denied — Administrator Privilege Required
        </h1>
        <p className="text-xs text-subtext leading-relaxed">
          You are currently logged in as <strong className="text-icewhite font-mono">{user.email}</strong> with role{' '}
          <span className="font-mono text-cyan">[{user.roles.join(', ')}]</span>.
          This account does not have administrator authorization on the server.
        </p>
        <div className="flex items-center justify-center gap-4 pt-2">
          <NavLink
            to="/player"
            className="px-5 py-2.5 rounded-lg bg-deepteal border border-aroraborder text-xs font-bold uppercase text-icewhite hover:border-cyan"
          >
            Return To Player Hub
          </NavLink>
        </div>
      </div>
    );
  }

  const adminNav = [
    { label: '1. Overview', path: '/admin', icon: LayoutDashboard, exact: true },
    { label: '2. Tournament Management', path: '/admin/tournaments', icon: Trophy },
    { label: '3. Squad Registrations', path: '/admin/registrations', icon: ClipboardList },
    { label: '4. Payment Verification', path: '/admin/payments', icon: CreditCard },
    { label: '5. Match Room Management', path: '/admin/credentials', icon: KeyRound },
    { label: '6. Results & Rankings', path: '/admin/results', icon: Award },
    { label: '7. Announcements & Settings', path: '/admin/settings', icon: Settings },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Admin Warning Ribbon */}
      <div className="mb-6 p-3 bg-deepteal/80 border border-neongreen/40 rounded-xl flex items-center justify-between gap-4 shadow-neon">
        <div className="flex items-center gap-2.5 text-xs text-icewhite">
          <ShieldAlert className="w-4 h-4 text-neongreen flex-shrink-0" />
          <span>
            <strong>ADMINISTRATOR CONSOLE:</strong> Logged in as{' '}
            <span className="text-neongreen font-mono">{user.email}</span> with server-enforced role access.
          </span>
        </div>
        <span className="text-[10px] font-mono uppercase bg-midnight px-2 py-0.5 rounded text-cyan border border-aroraborder">
          RBAC Active
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Admin Navigation Sidebar */}
        <aside className="space-y-2">
          <nav className="bg-deepteal/40 border border-aroraborder rounded-xl p-2 space-y-1">
            {adminNav.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.exact}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-heading font-bold uppercase tracking-wider transition-colors ${
                    isActive
                      ? 'bg-midnight text-neongreen border border-neongreen/50 shadow-neon'
                      : 'text-subtext hover:text-icewhite hover:bg-midnight/40'
                  }`
                }
              >
                <item.icon className="w-4 h-4 flex-shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </aside>

        {/* Admin Main View */}
        <main className="lg:col-span-3">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
