import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { ClipboardList, Download, Search, Hash, CheckCircle } from 'lucide-react';

export const RegistrationManagement: React.FC = () => {
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Slot Assignment Modal
  const [selectedReg, setSelectedReg] = useState<any | null>(null);
  const [newSlotNumber, setNewSlotNumber] = useState('');
  const [savingSlot, setSavingSlot] = useState(false);

  const loadRegistrations = () => {
    setLoading(true);
    api.registrations
      .getAdminList({ status: statusFilter, search: searchQuery })
      .then((res) => setRegistrations(res.registrations || []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadRegistrations();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadRegistrations();
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await api.registrations.updateStatus(id, newStatus);
      loadRegistrations();
    } catch (err: any) {
      alert(err.message || 'Failed to update registration status.');
    }
  };

  const handleSlotSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReg) return;
    setSavingSlot(true);
    try {
      await api.registrations.updateStatus(
        selectedReg.registration_id,
        undefined,
        parseInt(newSlotNumber, 10)
      );
      setSelectedReg(null);
      loadRegistrations();
    } catch (err: any) {
      alert(err.message || 'Failed to assign slot number.');
    } finally {
      setSavingSlot(false);
    }
  };

  const exportCSV = () => {
    if (registrations.length === 0) {
      alert('No registrations available to export.');
      return;
    }

    const headers = [
      'Registration ID',
      'Tournament',
      'Squad Name',
      'Slot Number',
      'Captain Name',
      'Captain Email',
      'Captain Phone',
      'Status',
      'Payment Status',
      'UTR',
      'Registered At',
    ];

    const rows = registrations.map((r) => [
      `"${r.registration_id}"`,
      `"${r.tournament_title}"`,
      `"${r.squad_name}"`,
      r.slot_number || '',
      `"${r.captain_name || ''}"`,
      `"${r.captain_email || ''}"`,
      `"${r.captain_phone || ''}"`,
      `"${r.status}"`,
      `"${r.payment_status || 'N/A'}"`,
      `"${r.utr || 'N/A'}"`,
      `"${new Date(r.created_at).toISOString()}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `arora_esports_registrations_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-cyan uppercase tracking-widest mb-1">
            <ClipboardList className="w-4 h-4 text-cyan" />
            <span>ROSTER ELIGIBILITY</span>
          </div>
          <h1 className="font-heading text-3xl font-extrabold uppercase text-icewhite">
            Squad &amp; Player Management
          </h1>
          <p className="text-xs text-subtext mt-1">
            Filter rosters, assign slot numbers, approve/cancel entries, and export registration CSV rosters.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={exportCSV}
            icon={<Download className="w-4 h-4" />}
          >
            Export Details (CSV)
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-deepteal/30 border border-aroraborder p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-card">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full sm:max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-subtext" />
          <input
            type="text"
            placeholder="Search captain, squad, tournament or UTR..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-midnight border border-aroraborder rounded-lg pl-9 pr-3 py-2 text-xs text-icewhite focus:outline-none focus:border-cyan"
          />
        </form>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-subtext font-mono uppercase">Filter:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-midnight border border-aroraborder rounded-lg px-3 py-2 text-xs text-icewhite focus:outline-none focus:border-cyan w-full sm:w-auto"
          >
            <option value="all">All Registrations</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Payment Submitted">Payment Submitted</option>
            <option value="Pending Payment">Pending Payment</option>
            <option value="Rejected">Rejected</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center text-xs text-subtext">Loading registrations...</div>
      ) : registrations.length > 0 ? (
        <div className="bg-deepteal/30 border border-aroraborder rounded-xl overflow-hidden shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-midnight/70 text-subtext uppercase font-mono tracking-wider border-b border-aroraborder">
                <tr>
                  <th className="py-3 px-4">Tournament</th>
                  <th className="py-3 px-4">Squad Name</th>
                  <th className="py-3 px-4">Slot</th>
                  <th className="py-3 px-4">Captain Contact</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Administrative Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-aroraborder/50 text-subtext">
                {registrations.map((r) => (
                  <tr key={r.registration_id} className="hover:bg-midnight/40">
                    <td className="py-3.5 px-4 font-heading text-sm font-bold text-icewhite">
                      {r.tournament_title}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-cyan">{r.squad_name}</td>
                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => {
                          setSelectedReg(r);
                          setNewSlotNumber(String(r.slot_number || ''));
                        }}
                        className="inline-flex items-center gap-1 font-mono font-bold text-neongreen bg-midnight px-2 py-0.5 rounded border border-aroraborder hover:border-neongreen text-xs"
                        title="Click to assign or change slot number"
                      >
                        <Hash className="w-3 h-3 text-subtext" />
                        <span>{r.slot_number ? `#${r.slot_number}` : 'Assign'}</span>
                      </button>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-icewhite font-bold block">{r.captain_name}</span>
                      <span className="text-[10px] text-gray-400 font-mono block">{r.captain_email}</span>
                      {r.captain_phone && (
                        <span className="text-[10px] text-subtext font-mono block">{r.captain_phone}</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge status={r.status} />
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <select
                        value={r.status}
                        onChange={(e) => handleStatusChange(r.registration_id, e.target.value)}
                        className="bg-midnight border border-aroraborder rounded px-2.5 py-1 text-xs text-icewhite focus:outline-none"
                      >
                        <option value="Confirmed">Confirm / Approve</option>
                        <option value="Pending Payment">Pending Payment</option>
                        <option value="Payment Submitted">Payment Submitted</option>
                        <option value="Cancelled">Cancel</option>
                        <option value="Rejected">Reject</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="p-8 text-center bg-deepteal/20 border border-aroraborder rounded-xl text-subtext text-xs">
          No tournament registrations match the selected filters.
        </div>
      )}

      {/* Assign Slot Number Modal */}
      <Modal
        isOpen={Boolean(selectedReg)}
        onClose={() => setSelectedReg(null)}
        title="Assign Squad Slot Number"
        maxWidth="sm"
      >
        {selectedReg && (
          <form onSubmit={handleSlotSave} className="space-y-4">
            <div className="p-3 bg-midnight rounded-lg border border-aroraborder text-xs text-subtext">
              Assign a dedicated slot number for <strong>{selectedReg.squad_name}</strong> in{' '}
              <span className="text-icewhite font-bold">{selectedReg.tournament_title}</span>.
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-icewhite">Slot Number (e.g. 1 - 12) *</label>
              <input
                type="number"
                min={1}
                max={50}
                required
                value={newSlotNumber}
                onChange={(e) => setNewSlotNumber(e.target.value)}
                className="w-full bg-midnight border border-aroraborder rounded-lg px-3 py-2 text-sm font-mono text-neongreen focus:outline-none focus:border-neongreen"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="ghost" onClick={() => setSelectedReg(null)}>
                Cancel
              </Button>
              <Button type="submit" loading={savingSlot}>
                Assign Slot
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
