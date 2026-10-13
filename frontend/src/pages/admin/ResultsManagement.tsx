import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { Button } from '../../components/ui/Button';
import { Award, Trophy, CheckCircle, AlertTriangle, Save } from 'lucide-react';

export const ResultsManagement: React.FC = () => {
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [selectedTournamentId, setSelectedTournamentId] = useState('');
  const [registeredSquads, setRegisteredSquads] = useState<any[]>([]);
  const [resultsRows, setResultsRows] = useState<any[]>([]);
  const [isPublished, setIsPublished] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    api.tournaments
      .list()
      .then((res) => {
        setTournaments(res.tournaments || []);
        if (res.tournaments.length > 0) {
          setSelectedTournamentId(res.tournaments[0].id);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedTournamentId) return;

    setMessage('');
    setErrorMessage('');

    Promise.all([
      api.tournaments.get(selectedTournamentId),
      api.results.getTournamentResults(selectedTournamentId),
    ]).then(([tData, rData]) => {
      const confirmed = (tData.registered_squads || []).filter(
        (s: any) => s.status === 'Confirmed'
      );
      setRegisteredSquads(confirmed);

      const existingResults = rData.results || [];
      if (existingResults.length > 0) {
        setIsPublished(existingResults[0].is_published || false);
        setResultsRows(
          confirmed.map((squad: any) => {
            const match = existingResults.find((r: any) => r.squad_id === squad.squad_id);
            return {
              squad_id: squad.squad_id,
              squad_name: squad.squad_name,
              placement: match ? match.placement : 1,
              kills: match ? match.kills : 0,
              points: match ? match.points : 0,
              prize_won: match ? match.prize_won : 0,
              is_winner: match ? match.is_winner : false,
            };
          })
        );
      } else {
        setIsPublished(false);
        setResultsRows(
          confirmed.map((squad: any, idx: number) => ({
            squad_id: squad.squad_id,
            squad_name: squad.squad_name,
            placement: idx + 1,
            kills: 0,
            points: 0,
            prize_won: 0,
            is_winner: idx === 0,
          }))
        );
      }
    });
  }, [selectedTournamentId]);

  const updateRow = (index: number, field: string, value: any) => {
    const updated = [...resultsRows];
    updated[index] = { ...updated[index], [field]: value };
    setResultsRows(updated);
  };

  const handleSaveResults = async (publish: boolean) => {
    if (resultsRows.length === 0) return;
    setSaving(true);
    setMessage('');
    setErrorMessage('');

    try {
      await api.results.saveAdmin({
        tournament_id: selectedTournamentId,
        results: resultsRows.map((r) => ({
          squad_id: r.squad_id,
          placement: parseInt(r.placement, 10),
          kills: parseInt(r.kills, 10),
          points: parseInt(r.points, 10),
          prize_won: parseFloat(r.prize_won),
          is_winner: Boolean(r.is_winner),
        })),
        is_published: publish,
      });

      setIsPublished(publish);
      setMessage(
        publish
          ? 'Results officially audited and PUBLISHED to public leaderboards!'
          : 'Draft results saved successfully.'
      );
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to record tournament results.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-xs font-mono text-cyan uppercase tracking-widest mb-1">
          <Award className="w-4 h-4 text-cyan" />
          <span>SCORING &amp; PRIZE AUDITING</span>
        </div>
        <h1 className="font-heading text-3xl font-extrabold uppercase text-icewhite">
          Results Management
        </h1>
        <p className="text-xs text-subtext mt-1">
          Enter match placements, kills, total points, and publish verified standings to public viewers.
        </p>
      </div>

      {message && (
        <div className="p-3 bg-emerald-950/60 border border-neongreen/50 rounded-lg text-xs text-neongreen flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-neongreen" />
          <span>{message}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3 bg-red-950/60 border border-red-500/50 rounded-lg text-xs text-red-200 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Tournament Selector */}
      <div className="bg-deepteal/30 border border-aroraborder p-4 rounded-xl flex items-center justify-between gap-4">
        <label className="text-xs font-bold uppercase text-icewhite">Select Tournament:</label>
        <select
          value={selectedTournamentId}
          onChange={(e) => setSelectedTournamentId(e.target.value)}
          className="bg-midnight border border-aroraborder rounded-lg px-3 py-2 text-xs text-icewhite focus:outline-none focus:border-cyan flex-1 max-w-md"
        >
          {tournaments.map((t) => (
            <option key={t.id} value={t.id}>
              {t.title} ({t.status})
            </option>
          ))}
        </select>
      </div>

      {/* Results Table */}
      {resultsRows.length > 0 ? (
        <div className="bg-deepteal/30 border border-aroraborder rounded-xl p-6 space-y-4 shadow-card">
          <div className="flex items-center justify-between">
            <h3 className="font-heading text-lg font-bold uppercase text-icewhite">
              Enter Squad Standings ({resultsRows.length} Confirmed Squads)
            </h3>
            <span
              className={`px-2.5 py-1 rounded text-xs font-mono font-bold uppercase ${
                isPublished
                  ? 'bg-emerald-950 border border-neongreen text-neongreen'
                  : 'bg-amber-950 border border-amber-500 text-amber-300'
              }`}
            >
              {isPublished ? 'Status: Published' : 'Status: Draft'}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-midnight/70 text-subtext uppercase font-mono tracking-wider border-b border-aroraborder">
                <tr>
                  <th className="py-3 px-4">Squad Name</th>
                  <th className="py-3 px-4">Placement (1-12)</th>
                  <th className="py-3 px-4">Kills</th>
                  <th className="py-3 px-4">Total Points</th>
                  <th className="py-3 px-4">Prize Disbursed (₹)</th>
                  <th className="py-3 px-4 text-center">Champion?</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-aroraborder/50 text-subtext">
                {resultsRows.map((row, idx) => (
                  <tr key={row.squad_id} className="hover:bg-midnight/40">
                    <td className="py-3 px-4 font-heading text-sm font-bold text-icewhite">
                      {row.squad_name}
                    </td>
                    <td className="py-3 px-4">
                      <input
                        type="number"
                        min={1}
                        max={50}
                        value={row.placement}
                        onChange={(e) => updateRow(idx, 'placement', e.target.value)}
                        className="w-16 bg-midnight border border-aroraborder rounded px-2 py-1 text-center font-mono text-icewhite"
                      />
                    </td>
                    <td className="py-3 px-4">
                      <input
                        type="number"
                        min={0}
                        value={row.kills}
                        onChange={(e) => updateRow(idx, 'kills', e.target.value)}
                        className="w-16 bg-midnight border border-aroraborder rounded px-2 py-1 text-center font-mono text-cyan"
                      />
                    </td>
                    <td className="py-3 px-4">
                      <input
                        type="number"
                        min={0}
                        value={row.points}
                        onChange={(e) => updateRow(idx, 'points', e.target.value)}
                        className="w-20 bg-midnight border border-aroraborder rounded px-2 py-1 text-center font-mono text-neongreen font-bold"
                      />
                    </td>
                    <td className="py-3 px-4">
                      <input
                        type="number"
                        min={0}
                        value={row.prize_won}
                        onChange={(e) => updateRow(idx, 'prize_won', e.target.value)}
                        className="w-24 bg-midnight border border-aroraborder rounded px-2 py-1 text-right font-mono text-icewhite"
                      />
                    </td>
                    <td className="py-3 px-4 text-center">
                      <input
                        type="checkbox"
                        checked={row.is_winner}
                        onChange={(e) => updateRow(idx, 'is_winner', e.target.checked)}
                        className="rounded border-aroraborder text-neongreen focus:ring-0"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-aroraborder">
            <Button
              variant="secondary"
              loading={saving}
              onClick={() => handleSaveResults(false)}
              icon={<Save className="w-4 h-4" />}
            >
              Save As Draft
            </Button>
            <Button
              variant="primary"
              loading={saving}
              onClick={() => handleSaveResults(true)}
              icon={<Trophy className="w-4 h-4" />}
            >
              Publish Standings To Public
            </Button>
          </div>
        </div>
      ) : (
        <div className="p-8 text-center bg-deepteal/20 border border-aroraborder rounded-xl text-subtext text-xs">
          No confirmed squads registered in this tournament to enter scores for.
        </div>
      )}
    </div>
  );
};
