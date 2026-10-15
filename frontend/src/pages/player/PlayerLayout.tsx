import React from 'react';
import { NavLink, Outlet, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Trophy,
  Users,
  CreditCard,
  DoorOpen,
  Award,
  Bell,
  User,
  Settings,
  LogOut,
  ShieldAlert,
} from 'lucide-react';

export const PlayerLayout: React.FC = () => {
  const { user, loading, logout } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center text-subtext text-sm">
        Authenticating player session...
      </div>
    );
  }

  if (!user) {
    const targetUrl = location.pathname + location.search;
    return <Navigate to={`/login?redirect=${encodeURIComponent(targetUrl)}`} replace />;
  }

  const navItems = [
    { label: 'Overview', path: '/player', icon: LayoutDashboard, exact: true },
    { label: 'My Tournaments', path: '/player/my-tournaments', icon: Trophy },
    { label: 'My Squad (Roster)', path: '/player/my-squad', icon: Users },
    { label: 'My Payments', path: '/player/my-payments', icon: CreditCard },
    { label: 'Match Room', path: '/player/match-room', icon: DoorOpen },
    { label: 'My Results', path: '/player/my-results', icon: Award },
    { label: 'Notifications', path: '/player/notifications', icon: Bell },
    { label: 'My Profile', path: '/player/profile', icon: User },
    { label: 'Account Settings', path: '/player/settings', icon: Settings },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Nav */}
        <aside className="space-y-4">
          {/* User mini badge */}
          <div className="bg-deepteal/50 border border-aroraborder p-4 rounded-xl flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-midnight border border-neongreen/40 flex items-center justify-center font-heading font-extrabold text-neongreen text-lg">
              {user.display_name?.charAt(0) || user.email.charAt(0).toUpperCase()}
            </div>
            <div className="truncate">
              <span className="font-heading text-sm font-bold text-icewhite block truncate">
                {user.display_name || user.email.split('@')[0]}
              </span>
              <span className="text-[11px] font-mono text-cyan truncate block">
                {user.free_fire_ign ? `IGN: ${user.free_fire_ign}` : user.email}
              </span>
            </div>
          </div>

          {/* Admin Console Shortcut if administrator */}
          {user.roles?.includes('Admin') && (
            <NavLink
              to="/admin"
              className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-deepteal to-midnight border border-neongreen/50 text-neongreen hover:border-neongreen transition-all shadow-neon"
            >
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-neongreen flex-shrink-0" />
                <span className="text-xs font-heading font-extrabold uppercase tracking-wider">
                  Open Admin Panel
                </span>
              </div>
              <span className="text-[10px] font-mono bg-midnight px-1.5 py-0.5 rounded text-cyan border border-aroraborder">
                ADMIN
              </span>
            </NavLink>
          )}

          <nav className="bg-deepteal/30 border border-aroraborder rounded-xl p-2 space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.exact}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors ${
                    isActive
                      ? 'bg-deepteal text-neongreen border border-neongreen/30 shadow-sm'
                      : 'text-subtext hover:text-icewhite hover:bg-midnight/40'
                  }`
                }
              >
                <item.icon className="w-4 h-4 flex-shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            ))}

            <button
              onClick={logout}
              className="flex items-center gap-3 w-full px-3.5 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider text-red-400 hover:bg-red-500/10 transition-colors mt-2"
            >
              <LogOut className="w-4 h-4 flex-shrink-0" />
              <span>Log Out</span>
            </button>
          </nav>
        </aside>

        {/* Main Content View */}
        <main className="lg:col-span-3">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
