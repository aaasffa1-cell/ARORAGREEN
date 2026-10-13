import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Users, Crown, ShieldAlert, CheckCircle, AlertTriangle } from 'lucide-react';

export const MySquad: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [squadName, setSquadName] = useState('');
  const [captainIgn, setCaptainIgn] = useState('');
  const [captainUid, setCaptainUid] = useState('');
  const [captainPhone, setCaptainPhone] = useState('');

  const [teammates, setTeammates] = useState([
    { ign: '', uid: '', phone: '', email: '' },
    { ign: '', uid: '', phone: '', email: '' },
    { ign: '', uid: '', phone: '', email: '' },
  ]);

  useEffect(() => {
    api.squads
      .getMySquad()
      .then((res) => {
        if (res.squad) {
          setSquadName(res.squad.name);
          const captain = res.members.find((m) => m.is_captain);
          if (captain) {
            setCaptainIgn(captain.ign);
            setCaptainUid(captain.uid);
            setCaptainPhone(captain.phone || '');
          }
          const otherMembers = res.members.filter((m) => !m.is_captain);
          if (otherMembers.length > 0) {
            setTeammates([
              {
                ign: otherMembers[0]?.ign || '',
                uid: otherMembers[0]?.uid || '',
                phone: otherMembers[0]?.phone || '',
                email: otherMembers[0]?.email || '',
              },
              {
                ign: otherMembers[1]?.ign || '',
                uid: otherMembers[1]?.uid || '',
                phone: otherMembers[1]?.phone || '',
                email: otherMembers[1]?.email || '',
              },
              {
                ign: otherMembers[2]?.ign || '',
                uid: otherMembers[2]?.uid || '',
                phone: otherMembers[2]?.phone || '',
                email: otherMembers[2]?.email || '',
              },
            ]);
          }
        } else if (user) {
          // Prepopulate captain from profile
          if (user.free_fire_ign) setCaptainIgn(user.free_fire_ign);
          if (user.free_fire_uid) setCaptainUid(user.free_fire_uid);
          if (user.phone) setCaptainPhone(user.phone);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [user]);

  const updateTeammate = (index: number, field: string, value: string) => {
    const updated = [...teammates];
    updated[index] = { ...updated[index], [field]: value };
    setTeammates(updated);
  };

  const handleSaveSquad = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    // Client-side validations
    if (!squadName.trim()) {
      setErrorMsg('Please specify a valid squad name.');
      return;
    }
    if (!captainIgn.trim() || !captainUid.trim()) {
      setErrorMsg('Captain Free Fire IGN and Player UID are mandatory.');
      return;
    }

    for (let i = 0; i < 3; i++) {
      if (!teammates[i].ign.trim() || !teammates[i].uid.trim()) {
        setErrorMsg(`Teammate #${i + 1} requires both Free Fire IGN and Player UID.`);
        return;
      }
    }

    const allUids = [captainUid.trim(), ...teammates.map((t) => t.uid.trim())];
    if (new Set(allUids).size !== 4) {
      setErrorMsg('Duplicate Player UID detected. Every squad member must have a distinct UID.');
      return;
    }

    setSaving(true);
    try {
      await api.squads.saveSquad({
        name: squadName.trim(),
        captain_ign: captainIgn.trim(),
        captain_uid: captainUid.trim(),
        captain_phone: captainPhone.trim(),
        teammates: teammates.map((t) => ({
          ign: t.ign.trim(),
          uid: t.uid.trim(),
          phone: t.phone.trim(),
          email: t.email.trim(),
        })),
      });

      setSuccessMsg('Squad roster successfully verified and updated!');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save squad roster.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-xs text-subtext">Loading squad details...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-xs font-mono text-cyan uppercase tracking-widest mb-1">
          <Users className="w-4 h-4 text-cyan" />
          <span>ROSTER COMPLIANCE</span>
        </div>
        <h1 className="font-heading text-3xl font-extrabold uppercase text-icewhite">
          4-Player Squad Management
        </h1>
        <p className="text-xs text-subtext mt-1">
          Official tournaments require a 4-member squad (1 Captain + 3 Teammates). Player UIDs will be audited in custom match rooms.
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

      <form onSubmit={handleSaveSquad} className="space-y-6">
        {/* Squad Name */}
        <div className="bg-deepteal/30 border border-aroraborder rounded-xl p-6 space-y-4">
          <h3 className="font-heading text-lg font-bold uppercase text-icewhite">
            Squad Information
          </h3>
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-icewhite">
              Official Squad Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. ALPHA PHANTOMS"
              value={squadName}
              onChange={(e) => setSquadName(e.target.value)}
              className="w-full bg-midnight border border-aroraborder rounded-lg px-4 py-2.5 text-sm text-icewhite focus:outline-none focus:border-neongreen"
            />
          </div>
        </div>

        {/* 1. Team Captain Section */}
        <div className="bg-deepteal/40 border border-aroraborder rounded-xl p-6 space-y-4 relative overflow-hidden">
          <div className="flex items-center gap-2 text-neongreen">
            <Crown className="w-5 h-5 text-amber-400" />
            <h3 className="font-heading text-lg font-bold uppercase tracking-wider text-icewhite">
              Team Captain (You)
            </h3>
          </div>
          <p className="text-xs text-subtext">
            Captain manages tournament registrations, submits payment UTRs, and receives custom room credentials.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="space-y-1">
              <label className="text-xs text-icewhite font-semibold">Free Fire IGN *</label>
              <input
                type="text"
                required
                placeholder="e.g. ARORA_CAPTAIN"
                value={captainIgn}
                onChange={(e) => setCaptainIgn(e.target.value)}
                className="w-full bg-midnight border border-aroraborder rounded-lg px-3 py-2 text-xs text-icewhite focus:outline-none focus:border-cyan"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-icewhite font-semibold">Player UID *</label>
              <input
                type="text"
                required
                placeholder="e.g. 192837465"
                value={captainUid}
                onChange={(e) => setCaptainUid(e.target.value)}
                className="w-full bg-midnight border border-aroraborder rounded-lg px-3 py-2 text-xs text-icewhite focus:outline-none focus:border-cyan"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-subtext">Phone (WhatsApp for alerts)</label>
              <input
                type="text"
                placeholder="e.g. +91 9876543210"
                value={captainPhone}
                onChange={(e) => setCaptainPhone(e.target.value)}
                className="w-full bg-midnight border border-aroraborder rounded-lg px-3 py-2 text-xs text-icewhite focus:outline-none focus:border-cyan"
              />
            </div>
          </div>
        </div>

        {/* 2. Three Teammates */}
        <div className="space-y-4">
          <h3 className="font-heading text-lg font-bold uppercase text-icewhite flex items-center gap-2">
            <Users className="w-5 h-5 text-cyan" />
            3 Mandatory Teammates
          </h3>

          <div className="grid grid-cols-1 gap-4">
            {teammates.map((teammate, index) => (
              <div
                key={index}
                className="bg-deepteal/30 border border-aroraborder rounded-xl p-5 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="font-heading text-sm font-bold text-cyan uppercase tracking-wider">
                    Teammate #{index + 1}
                  </span>
                  <span className="text-[10px] font-mono text-subtext">Active Roster</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs text-subtext font-semibold">Free Fire IGN *</label>
                    <input
                      type="text"
                      required
                      placeholder={`IGN #${index + 1}`}
                      value={teammate.ign}
                      onChange={(e) => updateTeammate(index, 'ign', e.target.value)}
                      className="w-full bg-midnight border border-aroraborder rounded-lg px-3 py-2 text-xs text-icewhite focus:outline-none focus:border-neongreen"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-subtext font-semibold">Player UID *</label>
                    <input
                      type="text"
                      required
                      placeholder={`UID #${index + 1}`}
                      value={teammate.uid}
                      onChange={(e) => updateTeammate(index, 'uid', e.target.value)}
                      className="w-full bg-midnight border border-aroraborder rounded-lg px-3 py-2 text-xs text-icewhite focus:outline-none focus:border-neongreen"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-subtext">Phone (Optional)</label>
                    <input
                      type="text"
                      placeholder="Phone"
                      value={teammate.phone}
                      onChange={(e) => updateTeammate(index, 'phone', e.target.value)}
                      className="w-full bg-midnight border border-aroraborder rounded-lg px-3 py-2 text-xs text-icewhite focus:outline-none focus:border-cyan"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-subtext">Email (Optional)</label>
                    <input
                      type="email"
                      placeholder="Email"
                      value={teammate.email}
                      onChange={(e) => updateTeammate(index, 'email', e.target.value)}
                      className="w-full bg-midnight border border-aroraborder rounded-lg px-3 py-2 text-xs text-icewhite focus:outline-none focus:border-cyan"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Button type="submit" loading={saving} size="lg" className="w-full py-3.5">
          Save 4-Player Squad Roster
        </Button>
      </form>
    </div>
  );
};
