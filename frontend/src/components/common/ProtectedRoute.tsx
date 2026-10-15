import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ShieldAlert, Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children?: React.ReactNode;
  requireAdmin?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAdmin = false,
}) => {
  const { user, loading, isAdmin } = useAuth();
  const location = useLocation();

  // Show loading spinner while verifying session
  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-4 px-4">
        <Loader2 className="w-10 h-10 text-neongreen animate-spin" />
        <p className="text-xs uppercase font-heading font-bold tracking-widest text-subtext animate-pulse">
          Verifying security credentials...
        </p>
      </div>
    );
  }

  // Not logged in -> Redirect immediately to /login with redirect URL
  if (!user) {
    const targetUrl = location.pathname + location.search;
    return <Navigate to={`/login?redirect=${encodeURIComponent(targetUrl)}`} replace />;
  }

  // Signed in, but requires admin and user is not admin
  if (requireAdmin && !isAdmin) {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center space-y-6">
        <div className="w-16 h-16 bg-deepteal border border-rose-500/50 rounded-2xl flex items-center justify-center mx-auto text-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.2)]">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h1 className="font-heading text-3xl font-extrabold uppercase text-icewhite">
          Admin Authorization Required
        </h1>
        <p className="text-sm text-subtext leading-relaxed">
          You are signed in as <span className="text-icewhite font-semibold font-mono">{user.email}</span>, but this account does not possess administrator credentials.
        </p>
        <div className="flex items-center justify-center gap-4 pt-2">
          <a
            href="/player"
            className="px-6 py-2.5 rounded-xl bg-neongreen text-midnight font-heading font-bold text-xs uppercase tracking-wider hover:bg-emerald-400 transition-all shadow-neon"
          >
            Go to Player Dashboard
          </a>
        </div>
      </div>
    );
  }

  return children ? <>{children}</> : null;
};
