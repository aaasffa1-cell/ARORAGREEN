import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { Tournament } from '../../types';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Trophy, Plus, Edit, CheckCircle, AlertTriangle, Timer, Clock } from 'lucide-react';
import { DateTimePicker } from '../../components/common/DateTimePicker';
import { TournamentStopwatch } from '../../components/common/TournamentStopwatch';

export const TournamentManagement: React.FC = () => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    game_title: 'Free Fire',
    game_mode: 'Battle Royale Squad',
    map_name: 'Bermuda',
    entry_fee: '100',
    prize_pool: '5000',
    max_squads: '12',
    registration_deadline: '',
    match_time: '',
    rules: '',
    status: 'Draft',
    publication_status: 'Draft',
  });

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const loadTournaments = () => {
    setLoading(true);
    api.tournaments
      .list()
      .then((res) => setTournaments(res.tournaments))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadTournaments();
  }, []);

  const openCreateModal = () => {
    const now = new Date();
    const deadline = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString();
    const match = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString();

    setEditingId(null);
    setFormData({
      title: '',
      description: '',
      game_title: 'Free Fire',
      game_mode: 'Battle Royale Squad',
      map_name: 'Bermuda',
      entry_fee: '100',
      prize_pool: '5000',
      max_squads: '12',
      registration_deadline: deadline,
      match_time: match,
      rules: '1. Standard competitive rules.\n2. Mobile devices only.\n3. Squad of 4 required.',
      status: 'Registration Open',
      publication_status: 'Published',
    });
    setErrorMsg('');
    setModalOpen(true);
  };

  const openEditModal = (t: Tournament) => {
    setEditingId(t.id);
    setFormData({
      title: t.title,
      description: t.description || '',
      game_title: t.game_title,
      game_mode: t.game_mode,
      map_name: t.map_name,
      entry_fee: String(t.entry_fee),
      prize_pool: String(t.prize_pool),
      max_squads: String(t.max_squads),
      registration_deadline: new Date(t.registration_deadline).toISOString(),
      match_time: new Date(t.match_time).toISOString(),
      rules: t.rules || '',
      status: t.status,
      publication_status: t.publication_status,
    });
    setErrorMsg('');
    setModalOpen(true);
  };

  const handleSaveTournament = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg('');

    try {
      if (editingId) {
        await api.tournaments.update(editingId, {
          ...formData,
          entry_fee: parseFloat(formData.entry_fee),
          prize_pool: parseFloat(formData.prize_pool),
          max_squads: parseInt(formData.max_squads, 10),
        });
      } else {
        await api.tournaments.create({
          ...formData,
          entry_fee: parseFloat(formData.entry_fee),
          prize_pool: parseFloat(formData.prize_pool),
          max_squads: parseInt(formData.max_squads, 10),
        });
      }
      setModalOpen(false);
      loadTournaments();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save tournament.');
    } finally {
      setSaving(false);
    }
  };

  const handleQuickStatus = async (id: string, status: string) => {
    try {
      await api.tournaments.updateStatus(id, status);
      loadTournaments();
    } catch (err: any) {
      alert(err.message || 'Failed to update status.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-cyan uppercase tracking-widest mb-1">
            <Trophy className="w-4 h-4 text-cyan" />
            <span>CIRCUIT CONFIGURATION</span>
          </div>
          <h1 className="font-heading text-3xl font-extrabold uppercase text-icewhite">
            Tournament Management
          </h1>
          <p className="text-xs text-subtext mt-1">
            Create, configure rules, adjust capacity, open/close registrations, and manage publication states.
          </p>
        </div>

        <Button onClick={openCreateModal} icon={<Plus className="w-4 h-4" />}>
          Create New Tournament
        </Button>
      </div>

      {loading ? (
        <div className="p-8 text-center text-xs text-subtext">Loading tournaments...</div>
      ) : (
        <div className="bg-deepteal/30 border border-aroraborder rounded-xl overflow-hidden shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-midnight/70 text-subtext uppercase font-mono tracking-wider border-b border-aroraborder">
                <tr>
                  <th className="py-3 px-4">Title</th>
                  <th className="py-3 px-4">Map &amp; Mode</th>
                  <th className="py-3 px-4">Match Schedule &amp; Stopwatch</th>
                  <th className="py-3 px-4">Capacity</th>
                  <th className="py-3 px-4">Prize Pool</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-aroraborder/50 text-subtext">
                {tournaments.map((t) => (
                  <tr key={t.id} className="hover:bg-midnight/40">
                    <td className="py-3 px-4 font-heading text-sm font-bold text-icewhite">
                      {t.title}
                    </td>
                    <td className="py-3 px-4 font-mono">
                      {t.map_name} ({t.game_mode})
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-mono text-xs text-icewhite font-semibold">
                        {new Date(t.match_time).toLocaleString('en-IN', {
                          timeZone: 'Asia/Kolkata',
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: true,
                        })} IST
                      </div>
                      <div className="mt-1">
                        <TournamentStopwatch targetTime={t.match_time} compact />
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-cyan">
                      {t.registered_squads_count || 0} / {t.max_squads} Squads
                    </td>
                    <td className="py-3 px-4 font-mono text-neongreen font-bold">
                      ₹{Number(t.prize_pool).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4">
                      <Badge status={t.status} />
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      {t.status === 'Registration Open' ? (
                        <button
                          onClick={() => handleQuickStatus(t.id, 'Registration Closed')}
                          className="px-2.5 py-1 rounded bg-amber-950/70 border border-amber-500/40 text-amber-300 text-[11px] font-mono hover:bg-amber-500/20"
                        >
                          Close Reg
                        </button>
                      ) : (
                        <button
                          onClick={() => handleQuickStatus(t.id, 'Registration Open')}
                          className="px-2.5 py-1 rounded bg-emerald-950/70 border border-neongreen/40 text-neongreen text-[11px] font-mono hover:bg-emerald-500/20"
                        >
                          Open Reg
                        </button>
                      )}

                      <button
                        onClick={() => openEditModal(t)}
                        className="px-2.5 py-1 rounded bg-deepteal border border-aroraborder text-icewhite text-[11px] font-mono hover:border-cyan"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? 'Edit Tournament' : 'Create New Free Fire Tournament'}
        maxWidth="lg"
      >
        <form onSubmit={handleSaveTournament} className="space-y-4">
          {errorMsg && (
            <div className="p-3 bg-red-950/60 border border-red-500/50 rounded-lg text-xs text-red-200">
              {errorMsg}
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-bold uppercase text-icewhite">Tournament Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Bermuda Championship Season 2"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full bg-midnight border border-aroraborder rounded-lg px-3 py-2 text-sm text-icewhite focus:outline-none focus:border-neongreen"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-icewhite">Map *</label>
              <select
                value={formData.map_name}
                onChange={(e) => setFormData({ ...formData, map_name: e.target.value })}
                className="w-full bg-midnight border border-aroraborder rounded-lg px-3 py-2 text-xs text-icewhite"
              >
                <option value="Bermuda">Bermuda</option>
                <option value="Purgatory">Purgatory</option>
                <option value="Kalahari">Kalahari</option>
                <option value="Alpine">Alpine</option>
                <option value="Nexterra">Nexterra</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-icewhite">Max Squad Capacity *</label>
              <input
                type="number"
                required
                min={2}
                max={50}
                value={formData.max_squads}
                onChange={(e) => setFormData({ ...formData, max_squads: e.target.value })}
                className="w-full bg-midnight border border-aroraborder rounded-lg px-3 py-2 text-xs text-icewhite"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-icewhite">Entry Fee (₹) *</label>
              <input
                type="number"
                required
                min={0}
                value={formData.entry_fee}
                onChange={(e) => setFormData({ ...formData, entry_fee: e.target.value })}
                className="w-full bg-midnight border border-aroraborder rounded-lg px-3 py-2 text-xs text-icewhite"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-icewhite">Prize Pool (₹) *</label>
              <input
                type="number"
                required
                min={0}
                value={formData.prize_pool}
                onChange={(e) => setFormData({ ...formData, prize_pool: e.target.value })}
                className="w-full bg-midnight border border-aroraborder rounded-lg px-3 py-2 text-xs text-icewhite"
              />
            </div>
          </div>

          <div className="space-y-3">
            <DateTimePicker
              label="Registration Deadline (IST)"
              value={formData.registration_deadline}
              onChange={(val) => setFormData({ ...formData, registration_deadline: val })}
              required
            />

            <DateTimePicker
              label="Match Start Time (IST)"
              value={formData.match_time}
              onChange={(val) => setFormData({ ...formData, match_time: val })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-icewhite">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full bg-midnight border border-aroraborder rounded-lg px-3 py-2 text-xs text-icewhite"
              >
                <option value="Draft">Draft</option>
                <option value="Published">Published</option>
                <option value="Registration Open">Registration Open</option>
                <option value="Registration Closed">Registration Closed</option>
                <option value="Live">Live</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-icewhite">Publication</label>
              <select
                value={formData.publication_status}
                onChange={(e) => setFormData({ ...formData, publication_status: e.target.value as any })}
                className="w-full bg-midnight border border-aroraborder rounded-lg px-3 py-2 text-xs text-icewhite"
              >
                <option value="Draft">Draft (Hidden)</option>
                <option value="Published">Published (Public)</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold uppercase text-icewhite">Official Rules</label>
            <textarea
              rows={3}
              value={formData.rules}
              onChange={(e) => setFormData({ ...formData, rules: e.target.value })}
              className="w-full bg-midnight border border-aroraborder rounded-lg px-3 py-2 text-xs text-icewhite resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              {editingId ? 'Update Tournament' : 'Create Tournament'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
