import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { Badge } from '../../components/ui/Badge';
import { Calendar, Clock, DoorOpen, Users } from 'lucide-react';

export const MatchScheduling: React.FC = () => {
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.matches
      .getAdminAll()
      .then((res) => setMatches(res.matches || []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-xs font-mono text-cyan uppercase tracking-widest mb-1">
          <Calendar className="w-4 h-4 text-cyan" />
          <span>TOURNAMENT TIMETABLE</span>
        </div>
        <h1 className="font-heading text-3xl font-extrabold uppercase text-icewhite">
          Match Schedules
        </h1>
        <p className="text-xs text-subtext mt-1">
          Review scheduled custom room matches, assigned match numbers, and countdown release timing.
        </p>
      </div>

      {loading ? (
        <div className="p-8 text-center text-xs text-subtext">Loading match schedules...</div>
      ) : matches.length > 0 ? (
        <div className="bg-deepteal/30 border border-aroraborder rounded-xl overflow-hidden shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-midnight/70 text-subtext uppercase font-mono tracking-wider border-b border-aroraborder">
                <tr>
                  <th className="py-3 px-4">Match #</th>
                  <th className="py-3 px-4">Tournament Title</th>
                  <th className="py-3 px-4">Scheduled Match Time</th>
                  <th className="py-3 px-4">Eligible Squads</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Room Credentials</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-aroraborder/50 text-subtext">
                {matches.map((m) => (
                  <tr key={m.id} className="hover:bg-midnight/40">
                    <td className="py-3.5 px-4 font-mono font-bold text-cyan">
                      Match {m.match_number}
                    </td>
                    <td className="py-3.5 px-4 font-heading text-sm font-bold text-icewhite">
                      {m.tournament_title}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-icewhite">
                      {new Date(m.scheduled_time).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST
                    </td>
                    <td className="py-3.5 px-4 font-mono text-neongreen font-bold">
                      {m.eligible_captains_count || 0} Squads
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge status={m.status} />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {m.credentials_released ? (
                        <span className="px-2.5 py-1 rounded bg-emerald-950 border border-neongreen text-neongreen font-mono text-[10px]">
                          Released
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded bg-deepteal border border-aroraborder text-subtext font-mono text-[10px]">
                          Sealed
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="p-8 text-center bg-deepteal/20 border border-aroraborder rounded-xl text-subtext text-xs">
          No matches currently scheduled.
        </div>
      )}
    </div>
  );
};
