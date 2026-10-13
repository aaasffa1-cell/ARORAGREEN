import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { TournamentResult } from '../../types';
import { EmptyState } from '../../components/ui/EmptyState';
import { Trophy, Medal, Swords, Award } from 'lucide-react';

export const PublicResults: React.FC = () => {
  const [results, setResults] = useState<TournamentResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.results
      .getPublic()
      .then((res) => {
        setResults(res.results);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  // Group by tournament title
  const groupedResults = results.reduce<Record<string, TournamentResult[]>>((acc, item) => {
    const title = item.tournament_title || 'Championship Series';
    if (!acc[title]) acc[title] = [];
    acc[title].push(item);
    return acc;
  }, {});

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      <div>
        <div className="flex items-center gap-2 text-xs font-mono text-neongreen uppercase tracking-widest mb-1">
          <Trophy className="w-4 h-4 text-neongreen" />
          <span>OFFICIAL HALL OF FAME</span>
        </div>
        <h1 className="font-heading text-4xl font-extrabold uppercase tracking-wide text-icewhite">
          Tournament Standings &amp; Results
        </h1>
        <p className="text-sm text-subtext mt-1">
          Audited match outcomes, placement points, total kills, and cash prizes won by participating Free Fire squads.
        </p>
      </div>

      {loading ? (
        <div className="space-y-6">
          {[1, 2].map((i) => (
            <div key={i} className="h-64 rounded-xl bg-deepteal/30 border border-aroraborder animate-pulse" />
          ))}
        </div>
      ) : Object.keys(groupedResults).length > 0 ? (
        <div className="space-y-10">
          {Object.entries(groupedResults).map(([tournamentTitle, squadList]) => (
            <div
              key={tournamentTitle}
              className="bg-deepteal/40 border border-aroraborder rounded-2xl overflow-hidden shadow-card"
            >
              {/* Tournament Title Banner */}
              <div className="px-6 py-4 bg-midnight/80 border-b border-aroraborder flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="font-heading text-xl font-bold uppercase text-icewhite">
                    {tournamentTitle}
                  </h3>
                  <span className="text-xs font-mono text-cyan">Official Final Standings</span>
                </div>
                <span className="px-3 py-1 rounded bg-neongreen/10 border border-neongreen/30 text-neongreen text-xs font-mono font-bold uppercase">
                  Audited &amp; Published
                </span>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-midnight/50 text-[11px] font-mono text-subtext uppercase tracking-wider border-b border-aroraborder">
                    <tr>
                      <th className="py-3.5 px-6">Rank</th>
                      <th className="py-3.5 px-6">Squad Name</th>
                      <th className="py-3.5 px-6 text-center">Kills</th>
                      <th className="py-3.5 px-6 text-center">Placement</th>
                      <th className="py-3.5 px-6 text-center">Total Points</th>
                      <th className="py-3.5 px-6 text-right">Prize Disbursed</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-aroraborder/50 text-subtext">
                    {squadList.map((row) => {
                      const isChampion = row.placement === 1 || row.is_winner;
                      return (
                        <tr
                          key={row.id}
                          className={`hover:bg-deepteal/60 transition-colors ${
                            isChampion ? 'bg-neongreen/5' : ''
                          }`}
                        >
                          <td className="py-4 px-6">
                            <span
                              className={`inline-flex items-center justify-center w-7 h-7 rounded-md font-heading font-extrabold text-sm ${
                                isChampion
                                  ? 'bg-amber-400 text-midnight shadow-[0_0_10px_rgba(251,191,36,0.5)]'
                                  : row.placement === 2
                                  ? 'bg-slate-300 text-midnight'
                                  : row.placement === 3
                                  ? 'bg-amber-700 text-white'
                                  : 'bg-midnight text-subtext border border-aroraborder'
                              }`}
                            >
                              {row.placement}
                            </span>
                          </td>
                          <td className="py-4 px-6 font-heading text-base font-bold text-icewhite">
                            <div className="flex items-center gap-2">
                              {row.squad_name}
                              {isChampion && (
                                <span title="Championship Winner">
                                  <Award className="w-4 h-4 text-amber-400" />
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-6 text-center font-mono font-semibold text-cyan">
                            {row.kills}
                          </td>
                          <td className="py-4 px-6 text-center font-mono">#{row.placement}</td>
                          <td className="py-4 px-6 text-center font-heading text-base font-extrabold text-neongreen">
                            {row.points} pts
                          </td>
                          <td className="py-4 px-6 text-right font-heading text-base font-bold text-icewhite">
                            {Number(row.prize_won) > 0 ? (
                              <span className="text-neongreen">
                                ₹{Number(row.prize_won).toLocaleString('en-IN')}
                              </span>
                            ) : (
                              <span className="text-gray-600">-</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Trophy}
          title="No Published Tournament Results Yet"
          description="Current tournaments are in progress or awaiting administrative score verification. Once the referee board audits match outcomes, published standings will appear here."
          actionText="View Open Tournaments"
          onAction={() => (window.location.href = '/tournaments')}
        />
      )}
    </div>
  );
};
