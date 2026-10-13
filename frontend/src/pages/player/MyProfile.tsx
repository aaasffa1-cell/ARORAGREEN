import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Button } from '../../components/ui/Button';
import { User, CheckCircle, AlertTriangle } from 'lucide-react';

export const MyProfile: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [freeFireIgn, setFreeFireIgn] = useState('');
  const [freeFireUid, setFreeFireUid] = useState('');
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (user) {
      setDisplayName(user.display_name || '');
      setPhone(user.phone || '');
      setFreeFireIgn(user.free_fire_ign || '');
      setFreeFireUid(user.free_fire_uid || '');
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      await api.auth.updateProfile({
        display_name: displayName.trim(),
        phone: phone.trim(),
        free_fire_ign: freeFireIgn.trim(),
        free_fire_uid: freeFireUid.trim(),
      });
      await refreshUser();
      setSuccessMsg('Profile details successfully updated!');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <div className="flex items-center gap-2 text-xs font-mono text-cyan uppercase tracking-widest mb-1">
          <User className="w-4 h-4 text-cyan" />
          <span>IDENTITY &amp; IN-GAME DETAILS</span>
        </div>
        <h1 className="font-heading text-3xl font-extrabold uppercase text-icewhite">
          My Player Profile
        </h1>
        <p className="text-xs text-subtext mt-1">
          Keep your primary Free Fire IGN and UID synchronized for automated squad rosters and referee audits.
        </p>
      </div>

      {errorMsg && (
        <div className="p-3 bg-red-950/60 border border-red-500/50 rounded-lg text-xs text-red-200 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3 bg-emerald-950/60 border border-neongreen/50 rounded-lg text-xs text-neongreen flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-neongreen flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-deepteal/30 border border-aroraborder rounded-xl p-6 space-y-4">
        <div className="space-y-1">
          <label className="text-xs font-bold uppercase text-subtext">Registered Email</label>
          <input
            type="email"
            disabled
            value={user?.email || ''}
            className="w-full bg-midnight/50 border border-aroraborder rounded-lg px-3.5 py-2.5 text-xs text-subtext cursor-not-allowed font-mono"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-bold uppercase text-icewhite">Display Name *</label>
          <input
            type="text"
            required
            placeholder="e.g. Captain Alpha"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full bg-midnight border border-aroraborder rounded-lg px-3.5 py-2.5 text-sm text-icewhite focus:outline-none focus:border-neongreen"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-bold uppercase text-icewhite">Phone Number (For WhatsApp Alerts)</label>
          <input
            type="text"
            placeholder="+91 98765 43210"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full bg-midnight border border-aroraborder rounded-lg px-3.5 py-2.5 text-sm text-icewhite focus:outline-none focus:border-cyan"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-aroraborder/50">
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase text-icewhite">Free Fire In-Game Name (IGN)</label>
            <input
              type="text"
              placeholder="e.g. ARORA_VIPER"
              value={freeFireIgn}
              onChange={(e) => setFreeFireIgn(e.target.value)}
              className="w-full bg-midnight border border-aroraborder rounded-lg px-3.5 py-2.5 text-sm text-icewhite focus:outline-none focus:border-neongreen"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold uppercase text-icewhite">Free Fire Player UID</label>
            <input
              type="text"
              placeholder="e.g. 192837465"
              value={freeFireUid}
              onChange={(e) => setFreeFireUid(e.target.value)}
              className="w-full bg-midnight border border-aroraborder rounded-lg px-3.5 py-2.5 text-sm text-icewhite focus:outline-none focus:border-neongreen"
            />
          </div>
        </div>

        <div className="pt-2">
          <Button type="submit" loading={saving} className="w-full py-3">
            Save Profile Details
          </Button>
        </div>
      </form>
    </div>
  );
};
