import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BrandLogo } from './BrandLogo';
import { api } from '../services/api';
import {
  Trophy,
  ShieldAlert,
  User,
  LogOut,
  Bell,
  Menu,
  X,
  FileText,
  HelpCircle,
  Headphones,
  CheckCircle,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, isAdmin, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const location = useLocation();

  useEffect(() => {
    if (user) {
      api.notifications.get().then((res) => setUnreadCount(res.unread_count)).catch(() => {});
    }
  }, [user, location.pathname]);

  const navLinks = [
    { label: 'Tournaments', path: '/tournaments', icon: Trophy },
    { label: 'Results', path: '/results', icon: CheckCircle },
    { label: 'Rules', path: '/rules', icon: FileText },
    { label: 'FAQ', path: '/faq', icon: HelpCircle },
    { label: 'Support', path: '/contact', icon: Headphones },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 bg-midnight/90 backdrop-blur-md border-b border-aroraborder">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand */}
        <BrandLogo />

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-2">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const active = isActive(link.path);
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-md text-sm font-medium transition-colors ${
                  active
                    ? 'text-neongreen bg-deepteal/80 border border-neongreen/30'
                    : 'text-subtext hover:text-icewhite hover:bg-deepteal/40'
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? 'text-neongreen' : 'text-subtext'}`} />
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Right Actions */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <>
              {/* Notification Bell */}
              <Link
                to="/player/notifications"
                className="relative p-2 text-subtext hover:text-icewhite hover:bg-deepteal rounded-lg transition-colors border border-transparent hover:border-aroraborder"
                title="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-neongreen ring-2 ring-midnight animate-pulse" />
                )}
              </Link>

              {/* Player Dashboard Shortcut */}
              <Link
                to="/player"
                className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-deepteal border border-aroraborder hover:border-neongreen/40 text-sm font-semibold text-icewhite transition-all shadow-sm"
              >
                <User className="w-4 h-4 text-cyan" />
                <span>Dashboard</span>
              </Link>

              {/* Admin Panel (If user has Admin role) */}
              {isAdmin && (
                <Link
                  to="/admin"
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-deepteal/90 border border-neongreen/50 text-xs font-bold uppercase tracking-wider text-neongreen hover:bg-deepteal hover:border-neongreen transition-all shadow-neon"
                >
                  <ShieldAlert className="w-4 h-4 text-neongreen" />
                  <span>Admin Panel</span>
                </Link>
              )}

              {/* Logout */}
              <button
                onClick={logout}
                className="p-2 text-subtext hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                title="Log out"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                to="/login"
                className="px-5 py-2.5 rounded-lg bg-neongreen hover:bg-emerald-400 text-midnight font-heading font-bold text-sm tracking-wider uppercase transition-all shadow-neon hover:shadow-[0_0_20px_rgba(0,245,160,0.4)]"
              >
                Player Login
              </Link>
            </div>
          )}
        </div>

        {/* Mobile menu button */}
        <div className="flex md:hidden items-center gap-2">
          {user && (
            <Link
              to="/player/notifications"
              className="relative p-2 text-subtext hover:text-icewhite"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-neongreen" />
              )}
            </Link>
          )}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-subtext hover:text-icewhite rounded-lg"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-deepteal border-b border-aroraborder px-4 pt-2 pb-6 space-y-3">
          <div className="space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${
                  isActive(link.path)
                    ? 'text-neongreen bg-midnight border border-neongreen/20'
                    : 'text-subtext hover:text-icewhite hover:bg-midnight/50'
                }`}
              >
                <link.icon className="w-4 h-4" />
                {link.label}
              </Link>
            ))}
          </div>

          <div className="pt-3 border-t border-aroraborder space-y-2">
            {user ? (
              <>
                <Link
                  to="/player"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 w-full px-4 py-2.5 rounded-lg bg-midnight border border-aroraborder text-icewhite text-sm font-medium"
                >
                  <User className="w-4 h-4 text-cyan" />
                  Player Dashboard
                </Link>

                {isAdmin && (
                  <Link
                    to="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 w-full px-4 py-2.5 rounded-lg bg-midnight border border-neongreen text-neongreen text-sm font-bold uppercase tracking-wider"
                  >
                    <ShieldAlert className="w-4 h-4 text-neongreen" />
                    Admin Operations
                  </Link>
                )}

                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                  }}
                  className="flex items-center gap-2 w-full px-4 py-2.5 rounded-lg text-red-400 hover:bg-red-500/10 text-sm font-medium"
                >
                  <LogOut className="w-4 h-4" />
                  Log Out ({user.email})
                </button>
              </>
            ) : (
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-center w-full py-3 rounded-lg bg-neongreen text-midnight font-heading font-bold text-sm tracking-wider uppercase shadow-neon"
              >
                Player Login
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
