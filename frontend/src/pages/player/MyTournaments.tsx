import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { Registration } from '../../types';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { Trophy, Calendar, MapPin, DoorOpen, CreditCard } from 'lucide-react';
import { TournamentStopwatch } from '../../components/common/TournamentStopwatch';

export const MyTournaments: React.FC = () => {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.registrations
      .getMyRegistrations()
      .then((res) => setRegistrations(res.registrations))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-xs text-subtext">Loading registered tournaments...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-neongreen uppercase tracking-widest mb-1">
            <Trophy className="w-4 h-4 text-neongreen" />
            <span>SQUAD CAMPAIGNS</span>
          </div>
          <h1 className="font-heading text-3xl font-extrabold uppercase text-icewhite">
            My Registered Tournaments
          </h1>
          <p className="text-xs text-subtext mt-1">
            Review your registered slots, payment audit statuses, and access your custom match room.
          </p>
        </div>

        <Link
          to="/tournaments"
          className="px-4 py-2.5 rounded-lg bg-neongreen hover:bg-emerald-400 text-midnight text-xs font-heading font-bold uppercase tracking-wider shadow-neon flex items-center gap-2 self-start sm:self-auto transition-transform active:scale-95"
        >
          <Trophy className="w-4 h-4 text-midnight" />
          <span>Register For Upcoming Tournaments</span>
        </Link>
      </div>

      {registrations.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {registrations.map((reg) => {
            const isConfirmed = reg.registration_status === 'Confirmed';
            const matchDate = reg.match_time
              ? new Date(reg.match_time).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) + ' IST'
              : 'TBA';

            return (
              <div
                key={reg.registration_id}
                className="bg-deepteal/40 border border-aroraborder rounded-xl p-6 space-y-4 shadow-card"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono text-cyan">
                        Squad: {reg.squad_name}
                      </span>
                      {reg.slot_number && (
                        <span className="text-xs font-mono font-bold text-neongreen">
                          • Slot #{reg.slot_number}
                        </span>
                      )}
                    </div>
                    <h3 className="font-heading text-xl font-bold uppercase text-icewhite">
                      {reg.tournament_title}
                    </h3>
                  </div>
                  <div className="flex flex-wrap items-center gap-2.5">
                    {reg.match_time && <TournamentStopwatch targetTime={reg.match_time} compact />}
                    <Badge status={reg.registration_status} />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-midnight/70 rounded-lg border border-aroraborder/50 text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-mono text-subtext block">SCHEDULE</span>
                    <span className="font-mono text-icewhite flex items-center gap-1 mt-0.5">
                      <Calendar className="w-3.5 h-3.5 text-cyan" />
                      {matchDate}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-mono text-subtext block">MAP</span>
                    <span className="text-icewhite flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-neongreen" />
                      {reg.map_name || 'Bermuda'}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-mono text-subtext block">ENTRY FEE</span>
                    <span className="font-mono text-icewhite mt-0.5 block">
                      ₹{parseFloat(String(reg.entry_fee || 0)).toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-mono text-subtext block">PAYMENT AUDIT</span>
                    <div className="mt-0.5">
                      {reg.payment_status ? (
                        <Badge status={reg.payment_status} />
                      ) : (
                        <span className="text-gray-500 font-mono">Free Slot</span>
                      )}
                    </div>
                  </div>
                </div>

                {reg.rejection_reason && (
                  <div className="p-3 bg-rose-950/60 border border-rose-500/50 rounded-lg text-xs text-rose-300">
                    <strong>Payment Rejection Note:</strong> {reg.rejection_reason}
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-aroraborder/50">
                  <div className="text-xs text-subtext">
                    Registered on:{' '}
                    {reg.registered_at ? new Date(reg.registered_at).toLocaleDateString() : '-'}
                  </div>

                  <div className="flex items-center gap-3">
                    {/* If payment pending, link to payments */}
                    {reg.registration_status === 'Pending Payment' && (
                      <Link
                        to="/player/my-payments"
                        className="px-4 py-2 rounded-lg bg-deepteal border border-amber-500/50 text-amber-300 hover:bg-amber-500/20 text-xs font-heading font-bold uppercase tracking-wider flex items-center gap-1.5"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        Submit Payment UTR
                      </Link>
                    )}

                    {isConfirmed && (
                      <Link
                        to="/player/match-room"
                        className="px-4 py-2 rounded-lg bg-neongreen hover:bg-emerald-400 text-midnight text-xs font-heading font-bold uppercase tracking-wider shadow-neon flex items-center gap-1.5"
                      >
                        <DoorOpen className="w-3.5 h-3.5" />
                        Go To Match Room
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={Trophy}
          title="No Tournaments Registered"
          description="Your squad is not currently enrolled in any open tournaments."
          actionText="Explore Open Tournaments"
          onAction={() => (window.location.href = '/tournaments')}
        />
      )}
    </div>
  );
};
