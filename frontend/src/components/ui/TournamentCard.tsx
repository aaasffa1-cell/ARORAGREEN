import React from 'react';
import { Link } from 'react-router-dom';
import { Tournament } from '../../types';
import { Badge } from './Badge';
import { Calendar, Users, Trophy, MapPin, Swords, Timer } from 'lucide-react';
import { TournamentStopwatch } from '../common/TournamentStopwatch';

interface TournamentCardProps {
  tournament: Tournament;
}

export const TournamentCard: React.FC<TournamentCardProps> = ({ tournament }) => {
  const registeredCount = Number(tournament.registered_squads_count || 0);
  const maxSquads = Number(tournament.max_squads || 12);
  const isFull = registeredCount >= maxSquads;
  const entryFeeNum = parseFloat(String(tournament.entry_fee || 0));

  const matchDate = new Date(tournament.match_time).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const matchTime = new Date(tournament.match_time).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  return (
    <div className="group relative bg-deepteal/50 hover:bg-deepteal/80 border border-aroraborder hover:border-neongreen/40 rounded-xl overflow-hidden transition-all duration-300 flex flex-col justify-between shadow-card hover:shadow-neon">
      {/* Top Banner & Status */}
      <div className="p-5 pb-3">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5 text-xs font-mono text-cyan">
            <Swords className="w-3.5 h-3.5 text-cyan" />
            <span>{tournament.game_mode}</span>
          </div>
          <Badge status={tournament.status} />
        </div>

        <h3 className="font-heading text-xl font-bold uppercase tracking-wide text-icewhite group-hover:text-neongreen transition-colors line-clamp-1 mb-2">
          {tournament.title}
        </h3>

        <p className="text-xs text-subtext line-clamp-2 leading-relaxed mb-4">
          {tournament.description || 'Official 4-Player Battle Royale tournament hosted by ARORA ESPORTS.'}
        </p>

        {/* Map & Schedule Pill */}
        <div className="grid grid-cols-2 gap-2 text-xs bg-midnight/60 p-2.5 rounded-lg border border-aroraborder/50 mb-3">
          <div className="flex items-center gap-1.5 text-subtext">
            <MapPin className="w-3.5 h-3.5 text-neongreen flex-shrink-0" />
            <span className="truncate">{tournament.map_name}</span>
          </div>
          <div className="flex items-center gap-1.5 text-subtext">
            <Calendar className="w-3.5 h-3.5 text-cyan flex-shrink-0" />
            <span className="truncate">{matchDate}, {matchTime}</span>
          </div>
        </div>

        {/* Live Match Stopwatch */}
        <div className="mb-3.5 flex items-center justify-between bg-midnight/40 px-3 py-1.5 rounded-lg border border-aroraborder/40">
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-subtext uppercase">
            <Timer className="w-3.5 h-3.5 text-cyan" />
            <span>Stopwatch:</span>
          </div>
          <TournamentStopwatch targetTime={tournament.match_time} compact />
        </div>

        {/* Prize Pool and Entry Fee */}
        <div className="flex items-center justify-between pt-2 border-t border-aroraborder/50">
          <div>
            <span className="text-[10px] uppercase tracking-wider text-subtext block font-mono">
              PRIZE POOL
            </span>
            <span className="font-heading text-lg font-extrabold text-neongreen flex items-center gap-1">
              <Trophy className="w-4 h-4 text-neongreen" />
              ₹{Number(tournament.prize_pool).toLocaleString('en-IN')}
            </span>
          </div>

          <div className="text-right">
            <span className="text-[10px] uppercase tracking-wider text-subtext block font-mono">
              ENTRY FEE
            </span>
            <span className="font-heading text-lg font-extrabold text-icewhite">
              {entryFeeNum === 0 ? (
                <span className="text-cyan">FREE ENTRY</span>
              ) : (
                `₹${entryFeeNum.toLocaleString('en-IN')}`
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Progress & Action Bottom Bar */}
      <div className="px-5 py-4 bg-midnight/70 border-t border-aroraborder">
        {/* Capacity Bar */}
        <div className="mb-3">
          <div className="flex items-center justify-between text-[11px] text-subtext mb-1.5 font-mono">
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3 text-cyan" />
              Roster Capacity
            </span>
            <span className={isFull ? 'text-rose-400 font-bold' : 'text-icewhite'}>
              {registeredCount} / {maxSquads} Squads {isFull ? '(FULL)' : ''}
            </span>
          </div>
          <div className="w-full h-1.5 bg-deepteal rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                isFull ? 'bg-rose-500' : 'bg-gradient-to-r from-cyan to-neongreen'
              }`}
              style={{ width: `${Math.min(100, (registeredCount / maxSquads) * 100)}%` }}
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <Link
            to={`/tournaments/${tournament.id}`}
            className="text-center py-2 px-3 rounded-lg bg-deepteal border border-aroraborder hover:border-neongreen/40 text-xs font-heading font-bold uppercase tracking-wider text-icewhite transition-colors"
          >
            Details
          </Link>

          {tournament.status === 'Registration Open' && !isFull ? (
            <Link
              to={`/tournaments/${tournament.id}?action=register`}
              className="text-center py-2 px-3 rounded-lg bg-neongreen hover:bg-emerald-400 text-midnight text-xs font-heading font-bold uppercase tracking-wider transition-all shadow-neon"
            >
              Register
            </Link>
          ) : (
            <button
              disabled
              className="py-2 px-3 rounded-lg bg-deepteal/50 text-subtext text-xs font-heading font-bold uppercase tracking-wider cursor-not-allowed border border-aroraborder/50"
            >
              {isFull ? 'Sold Out' : 'Closed'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
