import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Registration, Squad, MatchRoomInfo, Tournament } from '../../types';
import { Badge } from '../../components/ui/Badge';
import { TournamentCard } from '../../components/ui/TournamentCard';
import {
  Trophy,
  Users,
  CreditCard,
  DoorOpen,
  Calendar,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';

export const PlayerDashboard: React.FC = () => {
  const { user } = useAuth();
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [squad, setSquad] = useState<Squad | null>(null);
  const [matchRooms, setMatchRooms] = useState<MatchRoomInfo[]>([]);
  const [openTournaments, setOpenTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.registrations.getMyRegistrations().catch(() => ({ registrations: [] })),
      api.squads.getMySquad().catch(() => ({ squad: null, members: [] })),
      api.matches.getMyRoom().catch(() => ({ rooms: [] })),
      api.tournaments.list().catch(() => ({ tournaments: [] })),
    ])
      .then(([regRes, sqRes, roomRes, tourRes]) => {
        setRegistrations(regRes.registrations || []);
        setSquad(sqRes.squad || null);
        setMatchRooms(roomRes.rooms || []);
        const upcoming = (tourRes.tournaments || []).filter(
          (t: Tournament) => t.status === 'Registration Open' || t.status === 'Published'
        );
        setOpenTournaments(upcoming);
      })
      .finally(() => setLoading(false));
  }, []);

  const confirmedCount = registrations.filter((r) => r.registration_status === 'Confirmed').length;
  const pendingPaymentCount = registrations.filter(
    (r) => r.registration_status === 'Pending Payment' || r.registration_status === 'Payment Submitted'
  ).length;

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-deepteal to-midnight border border-aroraborder p-6 sm:p-8 rounded-2xl relative overflow-hidden shadow-card">
        <div className="space-y-2 relative z-10">
          <div className="flex items-center gap-2 text-xs font-mono text-neongreen uppercase tracking-widest">
            <ShieldCheck className="w-4 h-4 text-neongreen" />
            <span>PLAYER HUB</span>
          </div>
          <h1 className="font-heading text-3xl font-extrabold uppercase text-icewhite">
            Welcome back, {user?.display_name || user?.email.split('@')[0]}
          </h1>
          <p className="text-xs text-subtext max-w-xl leading-relaxed">
            Track your verified squad tournaments, payment verification states, and access released custom match room credentials.
          </p>
        </div>
      </div>

      {/* KPI Cards from Actual DB Records */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-deepteal/40 border border-aroraborder p-4 rounded-xl">
          <span className="text-[11px] font-mono text-subtext uppercase block">MY SQUAD</span>
          <span className="font-heading text-xl font-bold text-icewhite flex items-center gap-1.5 mt-1">
            <Users className="w-4 h-4 text-cyan" />
            {squad ? squad.name : 'Not Created'}
          </span>
        </div>

        <div className="bg-deepteal/40 border border-aroraborder p-4 rounded-xl">
          <span className="text-[11px] font-mono text-subtext uppercase block">CONFIRMED SLOTS</span>
          <span className="font-heading text-xl font-bold text-neongreen flex items-center gap-1.5 mt-1">
            <Trophy className="w-4 h-4 text-neongreen" />
            {confirmedCount}
          </span>
        </div>

        <div className="bg-deepteal/40 border border-aroraborder p-4 rounded-xl">
          <span className="text-[11px] font-mono text-subtext uppercase block">PENDING VERIFICATION</span>
          <span className="font-heading text-xl font-bold text-amber-300 flex items-center gap-1.5 mt-1">
            <CreditCard className="w-4 h-4 text-amber-400" />
            {pendingPaymentCount}
          </span>
        </div>

        <div className="bg-deepteal/40 border border-aroraborder p-4 rounded-xl">
          <span className="text-[11px] font-mono text-subtext uppercase block">UPCOMING MATCHES</span>
          <span className="font-heading text-xl font-bold text-icewhite flex items-center gap-1.5 mt-1">
            <DoorOpen className="w-4 h-4 text-cyan" />
            {matchRooms.length}
          </span>
        </div>
      </div>

      {/* Squad Status Warning if not created */}
      {!squad && (
        <div className="p-4 bg-amber-950/40 border border-amber-500/40 rounded-xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0" />
            <div>
              <span className="text-sm font-bold text-icewhite block font-heading">
                Squad Roster Incomplete
              </span>
              <span className="text-xs text-subtext">
                You must configure your 4-player squad (1 Captain + 3 Teammates) before registering for tournaments.
              </span>
            </div>
          </div>
          <Link
            to="/player/my-squad"
            className="px-4 py-2 rounded-lg bg-deepteal border border-amber-500/50 text-amber-300 hover:bg-amber-500/20 text-xs font-heading font-bold uppercase tracking-wider flex-shrink-0"
          >
            Create Squad
          </Link>
        </div>
      )}

      {/* Active Tournament Match Rooms */}
      <div className="bg-deepteal/30 border border-aroraborder rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-xl font-bold uppercase tracking-wider text-icewhite flex items-center gap-2">
            <DoorOpen className="w-5 h-5 text-neongreen" />
            Custom Room Credentials
          </h2>
          <Link
            to="/player/match-room"
            className="text-xs font-mono text-cyan hover:underline flex items-center gap-1"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="h-24 bg-midnight/50 rounded-lg animate-pulse" />
        ) : matchRooms.length > 0 ? (
          <div className="space-y-3">
            {matchRooms.slice(0, 2).map((room) => (
              <div
                key={room.match_id}
                className="p-4 bg-midnight rounded-xl border border-aroraborder flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-cyan">{room.game_mode}</span>
                    <span className="text-aroraborder">•</span>
                    <span className="text-xs font-mono text-subtext">{room.map_name}</span>
                  </div>
                  <h3 className="font-heading text-lg font-bold text-icewhite">
                    {room.tournament_title}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-subtext font-mono mt-1">
                    <Calendar className="w-3.5 h-3.5 text-cyan" />
                    <span>
                      {new Date(room.scheduled_time).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST
                    </span>
                  </div>
                </div>

                <div>
                  {room.credentials_released ? (
                    <Link
                      to="/player/match-room"
                      className="px-4 py-2 rounded-lg bg-neongreen hover:bg-emerald-400 text-midnight font-heading text-xs font-bold uppercase tracking-wider shadow-neon block text-center"
                    >
                      Room Details Released!
                    </Link>
                  ) : (
                    <span className="px-3.5 py-1.5 rounded-lg bg-deepteal border border-aroraborder text-xs text-subtext font-mono block text-center">
                      Releasing at T-10m
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-subtext italic py-2">
            No upcoming match rooms scheduled for your squad. Register for an open tournament below.
          </p>
        )}
      </div>

      {/* Open & Upcoming Tournaments Available for Registration */}
      <div className="bg-deepteal/30 border border-aroraborder rounded-xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-neongreen uppercase tracking-widest mb-1">
              <Trophy className="w-4 h-4 text-neongreen" />
              <span>CIRCUIT SCHEDULES</span>
            </div>
            <h2 className="font-heading text-xl font-bold uppercase tracking-wider text-icewhite">
              Upcoming Tournaments (Open For Registration)
            </h2>
          </div>
          <Link
            to="/tournaments"
            className="text-xs font-mono text-cyan hover:underline flex items-center gap-1 self-start sm:self-auto"
          >
            <span>View All Tournaments</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="h-64 bg-midnight/50 rounded-xl animate-pulse" />
            <div className="h-64 bg-midnight/50 rounded-xl animate-pulse" />
            <div className="h-64 bg-midnight/50 rounded-xl animate-pulse" />
          </div>
        ) : openTournaments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {openTournaments.slice(0, 3).map((t) => (
              <TournamentCard key={t.id} tournament={t} />
            ))}
          </div>
        ) : (
          <p className="text-xs text-subtext italic py-2">
            No tournaments currently open for registration. Check back soon for newly published tournament schedules!
          </p>
        )}
      </div>

      {/* Recent Registrations Table */}
      <div className="bg-deepteal/30 border border-aroraborder rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-xl font-bold uppercase tracking-wider text-icewhite flex items-center gap-2">
            <Trophy className="w-5 h-5 text-cyan" />
            Registered Tournaments
          </h2>
          <Link
            to="/player/my-tournaments"
            className="text-xs font-mono text-cyan hover:underline flex items-center gap-1"
          >
            <span>Manage All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="h-32 bg-midnight/50 rounded-lg animate-pulse" />
        ) : registrations.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-midnight/70 text-subtext uppercase font-mono tracking-wider border-b border-aroraborder">
                <tr>
                  <th className="py-3 px-4">Tournament</th>
                  <th className="py-3 px-4">Slot</th>
                  <th className="py-3 px-4">Entry Fee</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Payment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-aroraborder/50 text-subtext">
                {registrations.slice(0, 5).map((reg) => (
                  <tr key={reg.registration_id} className="hover:bg-midnight/40">
                    <td className="py-3 px-4 font-heading text-sm font-bold text-icewhite">
                      {reg.tournament_title}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-cyan">
                      #{reg.slot_number || '-'}
                    </td>
                    <td className="py-3 px-4 font-mono">
                      ₹{parseFloat(String(reg.entry_fee || 0)).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4">
                      <Badge status={reg.registration_status} />
                    </td>
                    <td className="py-3 px-4 text-right">
                      {reg.payment_status ? (
                        <Badge status={reg.payment_status} />
                      ) : (
                        <span className="text-gray-500 font-mono">Free / None</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-8 text-center space-y-3">
            <p className="text-xs text-subtext">You have not registered for any tournaments yet.</p>
            <Link
              to="/tournaments"
              className="inline-block px-4 py-2 rounded-lg bg-neongreen text-midnight font-heading text-xs font-bold uppercase tracking-wider shadow-neon"
            >
              Explore Open Tournaments
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};
