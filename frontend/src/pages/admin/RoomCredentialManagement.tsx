import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';
import { KeyRound, Send, CheckCircle, AlertTriangle, Users, Mail, Clock, Timer } from 'lucide-react';
import { TournamentStopwatch } from '../../components/common/TournamentStopwatch';
import { DateTimePicker } from '../../components/common/DateTimePicker';

export const RoomCredentialManagement: React.FC = () => {
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Configure Credentials Modal State
  const [configMatch, setConfigMatch] = useState<any | null>(null);
  const [roomIdInput, setRoomIdInput] = useState('');
  const [roomPasswordInput, setRoomPasswordInput] = useState('');
  const [scheduledTimeInput, setScheduledTimeInput] = useState('');
  const [savingConfig, setSavingConfig] = useState(false);

  // Send Credentials Modal State (Recipient Count Confirmation Dialog)
  const [sendMatch, setSendMatch] = useState<any | null>(null);
  const [eligibleInspection, setEligibleInspection] = useState<{
    has_credentials: boolean;
    eligible_count: number;
    captains: any[];
  } | null>(null);
  const [inspecting, setInspecting] = useState(false);
  const [dispatching, setDispatching] = useState(false);
  const [dispatchResult, setDispatchResult] = useState<{
    total: number;
    successful: number;
    failed: number;
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const loadMatches = () => {
    setLoading(true);
    api.matches
      .getAdminAll()
      .then((res) => setMatches(res.matches || []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadMatches();
  }, []);

  const openConfigModal = (m: any) => {
    setConfigMatch(m);
    setRoomIdInput(m.room_id || '');
    setRoomPasswordInput(m.room_password || '');
    setScheduledTimeInput(m.scheduled_time ? new Date(m.scheduled_time).toISOString() : new Date().toISOString());
    setErrorMsg('');
  };

  const handleSaveCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!configMatch) return;

    setSavingConfig(true);
    setErrorMsg('');

    try {
      await api.matches.configureCredentials(
        configMatch.id,
        roomIdInput.trim(),
        roomPasswordInput.trim(),
        scheduledTimeInput
      );
      setConfigMatch(null);
      loadMatches();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save room credentials.');
    } finally {
      setSavingConfig(false);
    }
  };

  const openSendConfirmModal = async (m: any) => {
    setSendMatch(m);
    setDispatchResult(null);
    setErrorMsg('');
    setInspecting(true);

    try {
      const insp = await api.matches.getEligibleCaptains(m.id);
      setEligibleInspection(insp);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to inspect eligible captains.');
    } finally {
      setInspecting(false);
    }
  };

  const handleExecuteSend = async () => {
    if (!sendMatch) return;
    setDispatching(true);
    setErrorMsg('');

    try {
      const res = await api.matches.sendCredentials(sendMatch.id);
      setDispatchResult(res.stats);
      loadMatches();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to release credentials.');
    } finally {
      setDispatching(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-xs font-mono text-neongreen uppercase tracking-widest mb-1">
          <KeyRound className="w-4 h-4 text-neongreen" />
          <span>MATCH ROOM OPERATIONS</span>
        </div>
        <h1 className="font-heading text-3xl font-extrabold uppercase text-icewhite">
          Custom Room Credentials &amp; Dispatch
        </h1>
        <p className="text-xs text-subtext mt-1">
          Configure protected custom room IDs and passwords. Click "SEND MATCH CREDENTIALS" manually at the T-10 minute mark.
        </p>
      </div>

      {loading ? (
        <div className="p-8 text-center text-xs text-subtext">Loading matches and credential status...</div>
      ) : matches.length > 0 ? (
        <div className="space-y-4">
          {matches.map((m) => {
            const hasCredentials = Boolean(m.room_id && m.room_password);
            const isReleased = m.credentials_released;
            const matchTimeStr = new Date(m.scheduled_time).toLocaleString('en-IN', {
              timeZone: 'Asia/Kolkata',
              hour: '2-digit',
              minute: '2-digit',
              hour12: true,
              day: 'numeric',
              month: 'short',
            });

            return (
              <div
                key={m.id}
                className="bg-deepteal/40 border border-aroraborder rounded-xl p-6 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 shadow-card"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="font-heading text-lg font-bold uppercase text-icewhite">
                      {m.tournament_title}
                    </span>
                    <Badge status={m.release_state || 'Pending'} />
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-subtext">
                    <span className="flex items-center gap-1 text-cyan font-bold">
                      <Clock className="w-3.5 h-3.5" />
                      {matchTimeStr} IST
                    </span>
                    <TournamentStopwatch targetTime={m.scheduled_time} />
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-neongreen" />
                      Eligible Confirmed Captains: <strong>{m.eligible_captains_count || 0}</strong>
                    </span>
                    {m.emails_sent_count > 0 && (
                      <span className="flex items-center gap-1 text-neongreen">
                        <Mail className="w-3.5 h-3.5" />
                        Emails Sent: {m.emails_sent_count}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openConfigModal(m)}
                    icon={<KeyRound className="w-4 h-4" />}
                  >
                    {hasCredentials ? 'Update Room Keys' : 'Configure Room Keys'}
                  </Button>

                  {/* The Critical Required Administrator Action Button */}
                  <Button
                    variant={isReleased ? 'secondary' : 'primary'}
                    size="md"
                    disabled={!hasCredentials}
                    onClick={() => openSendConfirmModal(m)}
                    icon={<Send className="w-4 h-4" />}
                    title={!hasCredentials ? 'Configure Room ID and Password first' : 'Click to manually send credentials'}
                  >
                    SEND MATCH CREDENTIALS
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-8 text-center bg-deepteal/20 border border-aroraborder rounded-xl text-subtext text-xs">
          No matches found. Create a tournament first to generate match schedules.
        </div>
      )}

      {/* Configure Credentials Modal */}
      <Modal
        isOpen={Boolean(configMatch)}
        onClose={() => setConfigMatch(null)}
        title="Configure Custom Room Credentials"
        maxWidth="md"
      >
        {configMatch && (
          <form onSubmit={handleSaveCredentials} className="space-y-4">
            {errorMsg && (
              <div className="p-3 bg-red-950/60 border border-red-500/50 rounded-lg text-xs text-red-200">
                {errorMsg}
              </div>
            )}

            <div className="p-3 bg-midnight rounded-lg border border-aroraborder text-xs text-subtext">
              Tournament: <strong className="text-icewhite">{configMatch.tournament_title}</strong>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-icewhite">Free Fire Custom Room ID *</label>
              <input
                type="text"
                required
                placeholder="e.g. 9812734"
                value={roomIdInput}
                onChange={(e) => setRoomIdInput(e.target.value)}
                className="w-full bg-midnight border border-aroraborder rounded-lg px-3 py-2 text-sm font-mono text-neongreen focus:outline-none focus:border-neongreen"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-icewhite">Custom Room Password *</label>
              <input
                type="text"
                required
                placeholder="e.g. ARORA77"
                value={roomPasswordInput}
                onChange={(e) => setRoomPasswordInput(e.target.value)}
                className="w-full bg-midnight border border-aroraborder rounded-lg px-3 py-2 text-sm font-mono text-cyan focus:outline-none focus:border-cyan"
              />
            </div>

            <DateTimePicker
              label="Match Scheduled Start Time (IST)"
              value={scheduledTimeInput}
              onChange={(val) => setScheduledTimeInput(val)}
              required
            />

            <p className="text-[11px] text-subtext leading-relaxed">
              These credentials are encrypted at rest and will NOT be visible to players until you click "SEND MATCH CREDENTIALS" manually.
            </p>

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="ghost" onClick={() => setConfigMatch(null)}>
                Cancel
              </Button>
              <Button type="submit" loading={savingConfig}>
                Save Protected Keys
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Send Confirmation Dialog with Recipient Count Inspection */}
      <Modal
        isOpen={Boolean(sendMatch)}
        onClose={() => setSendMatch(null)}
        title="Confirm Manual Credential Release (T-10m)"
        maxWidth="lg"
      >
        {sendMatch && (
          <div className="space-y-5">
            {errorMsg && (
              <div className="p-3 bg-red-950/60 border border-red-500/50 rounded-lg text-xs text-red-200">
                {errorMsg}
              </div>
            )}

            {dispatchResult ? (
              <div className="p-6 bg-midnight border border-neongreen rounded-xl text-center space-y-4">
                <CheckCircle className="w-10 h-10 text-neongreen mx-auto" />
                <h3 className="font-heading text-xl font-bold uppercase text-icewhite">
                  Credentials Dispatched!
                </h3>
                <div className="grid grid-cols-3 gap-2 text-xs font-mono max-w-sm mx-auto">
                  <div className="p-2 bg-deepteal rounded">
                    <span>Total</span>
                    <strong className="block text-icewhite text-sm">{dispatchResult.total}</strong>
                  </div>
                  <div className="p-2 bg-emerald-950 rounded text-neongreen">
                    <span>Delivered</span>
                    <strong className="block text-sm">{dispatchResult.successful}</strong>
                  </div>
                  <div className="p-2 bg-rose-950 rounded text-rose-300">
                    <span>Failed</span>
                    <strong className="block text-sm">{dispatchResult.failed}</strong>
                  </div>
                </div>
                <Button onClick={() => setSendMatch(null)} className="mt-4">
                  Close Window
                </Button>
              </div>
            ) : inspecting ? (
              <div className="py-8 text-center text-xs text-subtext">
                Inspecting verified squad rosters and captain email addresses...
              </div>
            ) : eligibleInspection ? (
              <>
                <div className="p-4 bg-midnight rounded-xl border border-aroraborder space-y-2.5 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-subtext">Tournament:</span>
                    <strong className="text-icewhite text-sm">{sendMatch.tournament_title}</strong>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-subtext">Live Match Stopwatch:</span>
                    <TournamentStopwatch targetTime={sendMatch.scheduled_time} size="md" />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-subtext">Eligible Confirmed Captains:</span>
                    <strong className="text-neongreen font-mono text-sm">
                      {eligibleInspection.eligible_count} Recipients
                    </strong>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-subtext">Room Credentials:</span>
                    <span className="text-cyan font-mono font-bold">Configured &amp; Verified</span>
                  </div>
                </div>

                {eligibleInspection.eligible_count === 0 ? (
                  <div className="p-4 bg-rose-950/60 border border-rose-500/40 rounded-xl text-xs text-rose-300">
                    ⚠️ There are 0 eligible confirmed squad captains for this tournament. Credentials cannot be sent. Verify that player registrations are confirmed and payments are approved.
                  </div>
                ) : (
                  <>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      <span className="text-[11px] font-mono uppercase text-subtext block">
                        Eligible Recipient List ({eligibleInspection.eligible_count}):
                      </span>
                      {eligibleInspection.captains.map((cap) => (
                        <div
                          key={cap.captain_id}
                          className="p-2 bg-deepteal/40 rounded flex items-center justify-between text-xs"
                        >
                          <div>
                            <span className="font-bold text-icewhite block">{cap.squad_name}</span>
                            <span className="text-[11px] text-gray-400">
                              Captain: {cap.captain_name} ({cap.captain_email})
                            </span>
                          </div>
                          <span className="text-[11px] font-mono text-cyan">Slot #{cap.slot_number}</span>
                        </div>
                      ))}
                    </div>

                    <p className="text-xs text-amber-300 leading-relaxed">
                      ⚠️ Clicking confirm will dispatch the Room ID and Password through Gmail SMTP to each verified captain and reveal it immediately in their Match Room dashboard.
                    </p>

                    <div className="flex justify-end gap-3 pt-2">
                      <Button variant="ghost" onClick={() => setSendMatch(null)} disabled={dispatching}>
                        Cancel
                      </Button>
                      <Button
                        onClick={handleExecuteSend}
                        loading={dispatching}
                        icon={<Send className="w-4 h-4" />}
                      >
                        Confirm &amp; Send To {eligibleInspection.eligible_count} Captains
                      </Button>
                    </div>
                  </>
                )}
              </>
            ) : null}
          </div>
        )}
      </Modal>
    </div>
  );
};
