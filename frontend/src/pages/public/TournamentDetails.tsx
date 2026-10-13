import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Tournament, Squad, SquadMember } from '../../types';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import {
  Trophy,
  Calendar,
  Users,
  MapPin,
  Clock,
  ShieldAlert,
  QrCode,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  Copy,
  Timer,
} from 'lucide-react';
import { TournamentStopwatch } from '../../components/common/TournamentStopwatch';

export const TournamentDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [matches, setMatches] = useState<any[]>([]);
  const [registeredSquads, setRegisteredSquads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Registration Modal State
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [mySquad, setMySquad] = useState<Squad | null>(null);
  const [myMembers, setMyMembers] = useState<SquadMember[]>([]);
  const [squadLoading, setSquadLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [utrInput, setUtrInput] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [settings, setSettings] = useState<{ upi_id: string; upi_payee_name: string; upi_qr_image_url: string }>({
    upi_id: '9010418179-2.wallet@phonepe',
    upi_payee_name: 'ARORA ESPORTS (PhonePe)',
    upi_qr_image_url: '/assets/phonepe_upi_qr.jpg',
  });

  useEffect(() => {
    api.settings
      .get()
      .then((res) => {
        if (res?.settings) {
          setSettings({
            upi_id: res.settings.upi_id || '9010418179-2.wallet@phonepe',
            upi_payee_name: res.settings.upi_payee_name || 'ARORA ESPORTS (PhonePe)',
            upi_qr_image_url: res.settings.upi_qr_image_url || '/assets/phonepe_upi_qr.jpg',
          });
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api.tournaments
      .get(id)
      .then((res) => {
        setTournament(res.tournament);
        setMatches(res.matches || []);
        setRegisteredSquads(res.registered_squads || []);
      })
      .catch((err) => {
        console.error(err);
      })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (searchParams.get('action') === 'register') {
      openRegistrationFlow();
    }
  }, [searchParams, tournament]);

  const openRegistrationFlow = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    if (!user) {
      navigate('/login?redirect=/tournaments/' + id + '?action=register');
      return;
    }

    setIsRegisterModalOpen(true);
    setSquadLoading(true);
    try {
      const res = await api.squads.getMySquad();
      setMySquad(res.squad);
      setMyMembers(res.members);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to check squad details.');
    } finally {
      setSquadLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tournament || !mySquad) return;

    setErrorMsg('');
    setSubmitting(true);

    try {
      // 1. Submit Registration
      const regRes = await api.registrations.register(tournament.id, mySquad.id);

      // 2. If tournament requires payment, submit UTR
      if (regRes.requires_payment) {
        if (!utrInput || utrInput.trim().length < 8) {
          throw new Error('Please enter a valid 8+ digit UPI transaction reference (UTR).');
        }
        await api.payments.submit(regRes.registration.id, utrInput.trim(), paymentNotes);
        setSuccessMsg(
          'Registration submitted with UTR reference! Tournament administrators will verify the incoming payment manually.'
        );
      } else {
        setSuccessMsg('Registration confirmed for free tournament! Slot guaranteed.');
      }

      setTimeout(() => {
        setIsRegisterModalOpen(false);
        navigate('/player/my-tournaments');
      }, 2500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to complete registration.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="h-96 rounded-xl bg-deepteal/30 border border-aroraborder animate-pulse" />
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-2xl font-bold uppercase text-icewhite">Tournament Not Found</h2>
        <Link to="/tournaments" className="text-neongreen font-heading underline">
          Return to Tournaments
        </Link>
      </div>
    );
  }

  const registeredCount = Number(tournament.registered_squads_count || 0);
  const maxSquads = Number(tournament.max_squads || 12);
  const isFull = registeredCount >= maxSquads;
  const entryFeeNum = parseFloat(String(tournament.entry_fee || 0));

  const matchDateTimeStr = new Date(tournament.match_time).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  const deadlineStr = new Date(tournament.registration_deadline).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Hero Header */}
      <div className="bg-deepteal/50 border border-aroraborder rounded-2xl p-6 sm:p-10 relative overflow-hidden shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-cyan uppercase tracking-wider">{tournament.game_title}</span>
            <span className="text-aroraborder">•</span>
            <span className="text-xs font-mono text-subtext">{tournament.game_mode}</span>
          </div>
          <Badge status={tournament.status} />
        </div>

        <h1 className="font-heading text-3xl sm:text-5xl font-extrabold uppercase tracking-tight text-icewhite mb-4">
          {tournament.title}
        </h1>

        <p className="text-sm sm:text-base text-subtext max-w-3xl leading-relaxed mb-8">
          {tournament.description || 'Official ARORA ESPORTS battle royale squad competition.'}
        </p>

        {/* Highlight Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-midnight/70 border border-aroraborder/60">
          <div>
            <span className="text-[11px] uppercase font-mono text-subtext block">PRIZE POOL</span>
            <span className="font-heading text-2xl font-extrabold text-neongreen flex items-center gap-1.5">
              <Trophy className="w-5 h-5 text-neongreen" />
              ₹{Number(tournament.prize_pool).toLocaleString('en-IN')}
            </span>
          </div>

          <div>
            <span className="text-[11px] uppercase font-mono text-subtext block">ENTRY FEE</span>
            <span className="font-heading text-2xl font-extrabold text-icewhite">
              {entryFeeNum === 0 ? <span className="text-cyan">FREE</span> : `₹${entryFeeNum.toLocaleString('en-IN')}`}
            </span>
          </div>

          <div>
            <span className="text-[11px] uppercase font-mono text-subtext block">MAP</span>
            <span className="font-heading text-xl font-bold text-icewhite flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-cyan" />
              {tournament.map_name}
            </span>
          </div>

          <div>
            <span className="text-[11px] uppercase font-mono text-subtext block">SLOTS</span>
            <span className="font-heading text-xl font-bold text-icewhite flex items-center gap-1.5">
              <Users className="w-4 h-4 text-cyan" />
              {registeredCount} / {maxSquads}
            </span>
          </div>
        </div>

        {/* Live Stopwatch Banner */}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-xl bg-midnight/90 border border-aroraborder">
          <div className="flex items-center gap-2.5">
            <Timer className="w-5 h-5 text-cyan animate-pulse" />
            <div>
              <span className="text-xs font-mono uppercase tracking-wider text-cyan block font-bold">MATCH COUNTDOWN &amp; STOPWATCH</span>
              <span className="text-xs text-subtext">Scheduled for {matchDateTimeStr} IST</span>
            </div>
          </div>
          <TournamentStopwatch targetTime={tournament.match_time} />
        </div>

        {/* Action Button */}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-aroraborder/60">
          <div className="flex items-center gap-3 text-xs text-subtext font-mono">
            <Clock className="w-4 h-4 text-amber-400" />
            <span>Registration Deadline: {deadlineStr} IST</span>
          </div>

          {tournament.status === 'Registration Open' && !isFull ? (
            <Button size="lg" onClick={openRegistrationFlow} className="w-full sm:w-auto">
              Register Squad (4 Players)
            </Button>
          ) : (
            <span className="px-6 py-3 rounded-lg bg-deepteal text-subtext font-heading text-sm font-bold uppercase tracking-wider border border-aroraborder">
              {isFull ? 'Tournament Capacity Full' : `Registration Closed (${tournament.status})`}
            </span>
          )}
        </div>
      </div>

      {/* Details & Rules Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Schedule & Registered Squads */}
        <div className="lg:col-span-2 space-y-8">
          {/* Schedule */}
          <div className="bg-deepteal/30 border border-aroraborder rounded-xl p-6 space-y-4">
            <h3 className="font-heading text-xl font-bold uppercase tracking-wider text-icewhite flex items-center gap-2">
              <Calendar className="w-5 h-5 text-cyan" />
              Match Schedule &amp; Format
            </h3>
            <div className="space-y-3 text-sm text-subtext">
              <div className="flex justify-between py-2 border-b border-aroraborder/40">
                <span>Scheduled Match Date:</span>
                <span className="text-icewhite font-mono">{matchDateTimeStr} IST</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-aroraborder/40">
                <span>Match Stopwatch:</span>
                <TournamentStopwatch targetTime={tournament.match_time} compact />
              </div>
              <div className="flex justify-between py-2 border-b border-aroraborder/40">
                <span>Room Credentials Release:</span>
                <span className="text-neongreen font-mono">T-10 Minutes Before Match</span>
              </div>
              <div className="flex justify-between py-2 border-b border-aroraborder/40">
                <span>Squad Requirement:</span>
                <span className="text-icewhite">1 Captain + 3 Teammates (Mobile Only)</span>
              </div>
            </div>
          </div>

          {/* Registered Squads Roster */}
          <div className="bg-deepteal/30 border border-aroraborder rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-heading text-xl font-bold uppercase tracking-wider text-icewhite flex items-center gap-2">
                <Users className="w-5 h-5 text-neongreen" />
                Registered Squads ({registeredSquads.length})
              </h3>
              <span className="text-xs font-mono text-subtext">Verified Slots</span>
            </div>

            {registeredSquads.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {registeredSquads.map((reg, idx) => (
                  <div
                    key={reg.registration_id}
                    className="p-3 bg-midnight/80 rounded-lg border border-aroraborder flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded bg-deepteal text-cyan text-xs font-mono font-bold flex items-center justify-center">
                        #{reg.slot_number || idx + 1}
                      </span>
                      <div>
                        <span className="text-sm font-heading font-bold text-icewhite block">
                          {reg.squad_name}
                        </span>
                        <span className="text-[11px] text-subtext">Captain: {reg.captain_name}</span>
                      </div>
                    </div>
                    <Badge status={reg.status} />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-subtext italic py-4">
                No squads have registered for this tournament yet. Be the first squad to claim Slot #1!
              </p>
            )}
          </div>
        </div>

        {/* Right Col: Official Rules */}
        <div className="space-y-6">
          <div className="bg-deepteal/30 border border-aroraborder rounded-xl p-6 space-y-4">
            <h3 className="font-heading text-xl font-bold uppercase tracking-wider text-icewhite flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-amber-400" />
              Tournament Rules
            </h3>
            <div className="text-xs text-subtext leading-relaxed whitespace-pre-line font-sans space-y-2">
              {tournament.rules ||
                `1. All players must drop with their official registered Free Fire UID.
2. Emulators, iPad, and PC setups are strictly forbidden. Mobile phones only.
3. Hackers, scripting, macro buttons, or game alterations will result in permanent team ban.
4. Squads must be in the custom room at least 5 minutes prior to match schedule.
5. In case of dispute, Team Captain must submit screenshots within 15 minutes of match completion.`}
            </div>
          </div>
        </div>
      </div>

      {/* Registration Modal */}
      <Modal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        title={`Register Squad for ${tournament.title}`}
        maxWidth="lg"
      >
        <div className="space-y-6">
          {errorMsg && (
            <div className="p-3 bg-red-950/60 border border-red-500/50 rounded-lg text-xs text-red-200 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-4 bg-emerald-950/80 border border-neongreen rounded-lg text-sm text-neongreen flex items-center gap-2">
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {squadLoading ? (
            <div className="py-8 text-center text-subtext text-xs">Checking squad roster...</div>
          ) : !mySquad || myMembers.length !== 4 ? (
            <div className="p-6 bg-midnight border border-amber-500/40 rounded-xl space-y-4 text-center">
              <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto" />
              <h4 className="font-heading text-lg font-bold uppercase text-icewhite">
                4-Player Squad Required
              </h4>
              <p className="text-xs text-subtext leading-relaxed max-w-md mx-auto">
                {!mySquad
                  ? 'You must create a squad first before registering for any tournament.'
                  : `Your squad "${mySquad.name}" currently has ${myMembers.length} member(s). A full 4-player roster (1 Captain + 3 Teammates) is mandatory.`}
              </p>
              <Button
                variant="secondary"
                onClick={() => {
                  setIsRegisterModalOpen(false);
                  navigate('/player/my-squad');
                }}
              >
                Go to Squad Roster Builder
              </Button>
            </div>
          ) : (
            <form onSubmit={handleRegisterSubmit} className="space-y-6">
              {/* Squad Summary */}
              <div className="p-4 bg-midnight rounded-xl border border-aroraborder space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-heading text-base font-bold text-icewhite">
                    Squad: {mySquad.name}
                  </span>
                  <span className="text-xs text-neongreen font-mono">4/4 Players Ready</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-subtext pt-2 border-t border-aroraborder/50">
                  {myMembers.map((m, i) => (
                    <div key={i} className="flex items-center justify-between p-1.5 bg-deepteal/30 rounded">
                      <span>{m.is_captain ? '👑 ' : ''}{m.ign}</span>
                      <span className="font-mono text-[10px] text-gray-400">UID: {m.uid}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment Section (If Entry Fee > 0) */}
              {entryFeeNum > 0 ? (
                <div className="p-5 bg-midnight rounded-xl border border-cyan/40 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-mono uppercase text-cyan block">Step 2: Manual UPI Payment</span>
                      <span className="font-heading text-lg font-extrabold text-icewhite">
                        Amount to Pay: ₹{entryFeeNum}
                      </span>
                    </div>
                    <span className="px-2.5 py-1 rounded bg-amber-950/80 text-amber-300 border border-amber-500/40 text-[10px] font-mono">
                      Manual Escrow
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-6 p-4 bg-deepteal/40 rounded-lg border border-aroraborder">
                    {/* Genuine QR Code */}
                    <img
                      src={settings.upi_qr_image_url}
                      alt="ARORA ESPORTS UPI QR"
                      className="w-32 h-32 rounded-lg border border-neongreen/40 bg-white p-1 object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/assets/phonepe_upi_qr.jpg';
                      }}
                    />

                    <div className="space-y-2 text-xs flex-1 text-subtext">
                      <p className="text-icewhite font-semibold">1. Scan PhonePe QR or copy official UPI ID.</p>
                      <div className="flex items-center gap-2 bg-midnight px-3 py-1.5 rounded border border-aroraborder">
                        <span className="font-mono text-cyan truncate">{settings.upi_id}</span>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(settings.upi_id);
                            setCopiedUpi(true);
                            setTimeout(() => setCopiedUpi(false), 2000);
                          }}
                          className="text-subtext hover:text-neongreen p-1"
                          title="Copy UPI ID"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        {copiedUpi && <span className="text-[10px] text-neongreen">Copied!</span>}
                      </div>
                      <p className="text-[11px] text-amber-300">
                        ⚠️ Pay exact entry fee (₹{entryFeeNum}). Copy the 12-digit UTR reference number from your receipt.
                      </p>
                    </div>
                  </div>

                  {/* UTR Input */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase text-icewhite tracking-wider">
                      Bank Transaction Reference (UTR Number) *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 428198765432"
                      value={utrInput}
                      onChange={(e) => setUtrInput(e.target.value)}
                      className="w-full bg-deepteal border border-aroraborder rounded-lg px-3 py-2 text-sm text-icewhite focus:outline-none focus:border-neongreen"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-subtext">Payment Notes / Sender Name (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. Paid via PhonePe from Captain Account"
                      value={paymentNotes}
                      onChange={(e) => setPaymentNotes(e.target.value)}
                      className="w-full bg-deepteal border border-aroraborder rounded-lg px-3 py-2 text-xs text-icewhite focus:outline-none focus:border-cyan"
                    />
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-emerald-950/40 border border-neongreen/40 rounded-xl text-xs text-neongreen">
                  ✨ This tournament is Free Entry. Your slot will be automatically confirmed upon submission.
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsRegisterModalOpen(false)}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button type="submit" loading={submitting}>
                  {entryFeeNum > 0 ? 'Submit UTR For Verification' : 'Confirm Registration'}
                </Button>
              </div>
            </form>
          )}
        </div>
      </Modal>
    </div>
  );
};
