import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { Users, AlertTriangle, CheckCircle, Search, Shield, Eye } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';

export const SquadManagement: React.FC = () => {
  const [squads, setSquads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSquad, setSelectedSquad] = useState<any | null>(null);

  useEffect(() => {
    api.squads
      .getAllAdmin()
      .then((res) => setSquads(res.squads || []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const filteredSquads = squads.filter((s) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      s.name?.toLowerCase().includes(q) ||
      s.captain_name?.toLowerCase().includes(q) ||
      s.captain_email?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-cyan uppercase tracking-widest mb-1">
            <Users className="w-4 h-4 text-cyan" />
            <span>ROSTER DIRECTORY</span>
          </div>
          <h1 className="font-heading text-3xl font-extrabold uppercase text-icewhite">
            Squad &amp; Player Management
          </h1>
          <p className="text-xs text-subtext mt-1">
            Inspect squad rosters, verified captains, all four teammates, and tournament league entries.
          </p>
        </div>

        {/* Search */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-subtext" />
          <input
            type="text"
            placeholder="Search squad or captain..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-midnight border border-aroraborder rounded-lg pl-9 pr-3 py-2 text-xs text-icewhite focus:outline-none focus:border-cyan"
          />
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center text-xs text-subtext">Loading squads...</div>
      ) : filteredSquads.length > 0 ? (
        <div className="bg-deepteal/30 border border-aroraborder rounded-xl overflow-hidden shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-midnight/70 text-subtext uppercase font-mono tracking-wider border-b border-aroraborder">
                <tr>
                  <th className="py-3 px-4">Squad Name</th>
                  <th className="py-3 px-4">Team Captain</th>
                  <th className="py-3 px-4">Roster Status</th>
                  <th className="py-3 px-4">Created Date</th>
                  <th className="py-3 px-4 text-center">Tournaments</th>
                  <th className="py-3 px-4 text-right">Roster Detail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-aroraborder/50 text-subtext">
                {filteredSquads.map((s) => {
                  const isComplete = parseInt(s.member_count, 10) === 4;
                  return (
                    <tr key={s.id} className="hover:bg-midnight/40">
                      <td className="py-3.5 px-4 font-heading text-sm font-bold text-icewhite">
                        {s.name}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-cyan block">{s.captain_name}</span>
                        <span className="text-[10px] text-gray-400 font-mono">{s.captain_email}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono ${
                            isComplete
                              ? 'bg-emerald-950/80 text-neongreen border border-neongreen/40'
                              : 'bg-amber-950/80 text-amber-300 border border-amber-500/40'
                          }`}
                        >
                          {isComplete ? <CheckCircle className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                          {s.member_count} / 4 Players {isComplete ? '(Complete)' : '(Incomplete)'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono">
                        {new Date(s.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-icewhite">
                        {s.registrations_count}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setSelectedSquad(s)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-deepteal border border-aroraborder text-icewhite text-xs font-mono hover:border-cyan"
                        >
                          <Eye className="w-3.5 h-3.5 text-cyan" />
                          <span>View Roster</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="p-8 text-center bg-deepteal/20 border border-aroraborder rounded-xl text-subtext text-xs">
          No squads match the search query.
        </div>
      )}

      {/* 4-Player Roster Inspection Modal */}
      <Modal
        isOpen={Boolean(selectedSquad)}
        onClose={() => setSelectedSquad(null)}
        title={selectedSquad ? `Squad Roster: ${selectedSquad.name}` : 'Squad Roster'}
        maxWidth="lg"
      >
        {selectedSquad && (
          <div className="space-y-4">
            <div className="p-4 bg-midnight rounded-xl border border-aroraborder flex flex-col sm:flex-row justify-between gap-3 text-xs">
              <div>
                <span className="text-subtext block">Team Captain:</span>
                <span className="text-icewhite font-bold text-sm">{selectedSquad.captain_name}</span>
                <span className="text-gray-400 font-mono block text-[11px]">{selectedSquad.captain_email}</span>
              </div>
              <div className="sm:text-right">
                <span className="text-subtext block">Total Roster:</span>
                <span className="text-neongreen font-mono font-bold text-sm">
                  {selectedSquad.member_count} / 4 Players
                </span>
                <span className="text-gray-400 font-mono block text-[11px]">
                  {selectedSquad.registrations_count} Tournaments Entered
                </span>
              </div>
            </div>

            <h4 className="font-heading text-sm font-bold uppercase text-cyan tracking-wider">
              All 4 Squad Members &amp; Free Fire IDs
            </h4>

            <div className="space-y-2">
              {Array.isArray(selectedSquad.members) && selectedSquad.members.length > 0 ? (
                selectedSquad.members.map((m: any, idx: number) => (
                  <div
                    key={m.id || idx}
                    className={`p-3 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs ${
                      m.is_captain
                        ? 'bg-midnight border-cyan/50 text-icewhite'
                        : 'bg-deepteal/30 border-aroraborder text-subtext'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-deepteal border border-aroraborder flex items-center justify-center font-mono font-bold text-xs text-icewhite">
                        {idx + 1}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-heading text-sm font-bold text-icewhite">{m.ign}</span>
                          {m.is_captain && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan/20 border border-cyan/50 text-cyan">
                              CAPTAIN
                            </span>
                          )}
                        </div>
                        {m.email && <span className="text-[11px] text-gray-400 block">{m.email}</span>}
                      </div>
                    </div>

                    <div className="sm:text-right font-mono">
                      <span className="text-gray-400 block text-[10px] uppercase">Free Fire UID</span>
                      <span className="text-neongreen font-bold text-sm">{m.uid}</span>
                      {m.phone && <span className="text-[11px] text-subtext block">{m.phone}</span>}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 bg-midnight rounded text-subtext text-xs italic">
                  No member records found for this squad.
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3">
              <Button variant="ghost" onClick={() => setSelectedSquad(null)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
