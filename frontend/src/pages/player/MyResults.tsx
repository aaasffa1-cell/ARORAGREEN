import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { TournamentResult } from '../../types';
import { EmptyState } from '../../components/ui/EmptyState';
import { Award, Trophy, Swords } from 'lucide-react';

export const MyResults: React.FC = () => {
  const [results, setResults] = useState<TournamentResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.results
      .getMyResults()
      .then((res) => setResults(res.results || []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-xs text-subtext">Loading results history...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-xs font-mono text-cyan uppercase tracking-widest mb-1">
          <Award className="w-4 h-4 text-cyan" />
          <span>SQUAD PERFORMANCE</span>
        </div>
        <h1 className="font-heading text-3xl font-extrabold uppercase text-icewhite">
          My Tournament Results
        </h1>
        <p className="text-xs text-subtext mt-1">
          Review your squad's past tournament placements, match kills, total score, and prize money won.
        </p>
      </div>

      {results.length > 0 ? (
        <div className="bg-deepteal/30 border border-aroraborder rounded-xl p-6 space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-midnight/70 text-subtext uppercase font-mono tracking-wider border-b border-aroraborder">
                <tr>
                  <th className="py-3 px-4">Tournament</th>
                  <th className="py-3 px-4">Squad</th>
                  <th className="py-3 px-4 text-center">Rank</th>
                  <th className="py-3 px-4 text-center">Kills</th>
                  <th className="py-3 px-4 text-center">Total Points</th>
                  <th className="py-3 px-4 text-right">Prize Won</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-aroraborder/50 text-subtext">
                {results.map((r) => (
                  <tr key={r.id} className="hover:bg-midnight/40">
                    <td className="py-3.5 px-4 font-heading text-sm font-bold text-icewhite">
                      {r.tournament_title}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-cyan">{r.squad_name}</td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-flex items-center justify-center w-6 h-6 rounded font-heading font-bold ${
                          r.placement === 1
                            ? 'bg-amber-400 text-midnight'
                            : 'bg-midnight text-subtext border border-aroraborder'
                        }`}
                      >
                        #{r.placement}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-neongreen">
                      {r.kills}
                    </td>
                    <td className="py-3.5 px-4 text-center font-heading text-sm font-bold text-icewhite">
                      {r.points} pts
                    </td>
                    <td className="py-3.5 px-4 text-right font-heading text-sm font-bold text-neongreen">
                      {Number(r.prize_won) > 0 ? `₹${Number(r.prize_won).toLocaleString('en-IN')}` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <EmptyState
          icon={Award}
          title="No Published Results Found"
          description="Your squad has not completed any official tournaments with published final scores yet."
        />
      )}
    </div>
  );
};
