import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Settings, ShieldCheck, LogOut, KeyRound } from 'lucide-react';

export const AccountSettings: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <div className="flex items-center gap-2 text-xs font-mono text-cyan uppercase tracking-widest mb-1">
          <Settings className="w-4 h-4 text-cyan" />
          <span>SECURITY &amp; PREFERENCES</span>
        </div>
        <h1 className="font-heading text-3xl font-extrabold uppercase text-icewhite">
          Account Settings
        </h1>
        <p className="text-xs text-subtext mt-1">
          Manage your session state, privacy protections, and access roles.
        </p>
      </div>

      {/* Security Info */}
      <div className="bg-deepteal/30 border border-aroraborder rounded-xl p-6 space-y-4">
        <h3 className="font-heading text-lg font-bold uppercase text-icewhite flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-neongreen" />
          Passwordless Session Security
        </h3>
        <p className="text-xs text-subtext leading-relaxed">
          ARORA ESPORTS does not utilize passwords or store credentials in browser localStorage. Every login session is authenticated through cryptographic single-use email OTP codes and protected via encrypted HTTP-only cookies.
        </p>
        <div className="p-3 bg-midnight rounded-lg border border-aroraborder text-xs text-subtext flex justify-between">
          <span>Active Role(s):</span>
          <span className="font-mono text-cyan font-bold">{user?.roles.join(', ')}</span>
        </div>
      </div>

      {/* Logout Box */}
      <div className="bg-deepteal/30 border border-rose-500/30 rounded-xl p-6 space-y-3">
        <h3 className="font-heading text-lg font-bold uppercase text-icewhite">
          Active Session Termination
        </h3>
        <p className="text-xs text-subtext">
          Terminate your authenticated session across this browser. You can re-authenticate anytime with your registered email.
        </p>
        <Button variant="danger" onClick={logout} icon={<LogOut className="w-4 h-4" />}>
          Log Out Of ARORA ESPORTS
        </Button>
      </div>
    </div>
  );
};
