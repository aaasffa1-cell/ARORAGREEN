import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { MatchRoomInfo } from '../../types';
import { EmptyState } from '../../components/ui/EmptyState';
import {
  DoorOpen,
  Lock,
  Unlock,
  Copy,
  Clock,
  Calendar,
  AlertTriangle,
  CheckCircle,
  ShieldCheck,
} from 'lucide-react';
import { TournamentStopwatch } from '../../components/common/TournamentStopwatch';

export const MatchRoom: React.FC = () => {
  const [rooms, setRooms] = useState<MatchRoomInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    api.matches
      .getMyRoom()
      .then((res) => setRooms(res.rooms || []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  if (loading) {
    return <div className="p-8 text-center text-xs text-subtext">Loading match rooms...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-xs font-mono text-cyan uppercase tracking-widest mb-1">
          <DoorOpen className="w-4 h-4 text-cyan" />
          <span>OFFICIAL CUSTOM LOBBIES</span>
        </div>
        <h1 className="font-heading text-3xl font-extrabold uppercase text-icewhite">
          Match Room Credentials
        </h1>
        <p className="text-xs text-subtext mt-1">
          Custom Room ID and Password credentials are released strictly 10 minutes prior to scheduled match time for verified squad captains.
        </p>
      </div>

      {rooms.length > 0 ? (
        <div className="grid grid-cols-1 gap-6">
          {rooms.map((room) => {
            const isReleased = room.credentials_released && room.room_id && room.room_password;
            const matchDateStr = new Date(room.scheduled_time).toLocaleString('en-IN', {
              timeZone: 'Asia/Kolkata',
              day: 'numeric',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              hour12: true,
            });

            return (
              <div
                key={room.match_id}
                className={`bg-deepteal/40 border rounded-2xl p-6 sm:p-8 space-y-6 shadow-card transition-all ${
                  isReleased
                    ? 'border-neongreen/60 shadow-[0_0_20px_rgba(0,245,160,0.15)]'
                    : 'border-aroraborder'
                }`}
              >
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-aroraborder/60">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono text-cyan">{room.game_mode}</span>
                      <span className="text-aroraborder">•</span>
                      <span className="text-xs font-mono text-subtext">{room.map_name}</span>
                    </div>
                    <h2 className="font-heading text-2xl font-bold uppercase text-icewhite">
                      {room.tournament_title}
                    </h2>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1.5 rounded-lg bg-midnight border border-aroraborder text-xs font-mono font-bold text-icewhite">
                      Assigned Slot: <span className="text-neongreen">#{room.slot_number || 1}</span>
                    </span>
                    <span
                      className={`px-3 py-1.5 rounded-lg text-xs font-heading font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                        isReleased
                          ? 'bg-emerald-950/80 text-neongreen border border-neongreen/50 shadow-neon'
                          : 'bg-amber-950/80 text-amber-300 border border-amber-500/40'
                      }`}
                    >
                      {isReleased ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                      {isReleased ? 'Credentials Released' : 'Releasing At T-10m'}
                    </span>
                  </div>
                </div>

                {/* Match Schedule & Stopwatch */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-midnight/60 rounded-xl border border-aroraborder/50">
                  <div className="flex items-center gap-2 text-xs font-mono text-subtext">
                    <Calendar className="w-4 h-4 text-cyan" />
                    <span>Match Schedule: <strong className="text-icewhite">{matchDateStr} IST</strong></span>
                  </div>
                  <TournamentStopwatch targetTime={room.scheduled_time} compact />
                </div>

                {/* Credentials Reveal Box */}
                {isReleased ? (
                  <div className="bg-midnight/90 border border-neongreen/40 rounded-xl p-6 space-y-4">
                    <div className="flex items-center gap-2 text-xs font-mono text-neongreen">
                      <CheckCircle className="w-4 h-4 text-neongreen" />
                      <span>OFFICIAL ROOM CREDENTIALS REVEALED</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Room ID */}
                      <div className="p-4 bg-deepteal/50 rounded-lg border border-aroraborder flex items-center justify-between">
                        <div>
                          <span className="text-[10px] font-mono uppercase text-subtext block">
                            CUSTOM ROOM ID
                          </span>
                          <span className="font-mono text-2xl font-bold text-neongreen tracking-wider">
                            {room.room_id}
                          </span>
                        </div>
                        <button
                          onClick={() => copyToClipboard(room.room_id!, `room-${room.match_id}`)}
                          className="p-2 text-subtext hover:text-neongreen hover:bg-midnight rounded-lg transition-colors"
                          title="Copy Room ID"
                        >
                          <Copy className="w-5 h-5" />
                        </button>
                      </div>

                      {/* Room Password */}
                      <div className="p-4 bg-deepteal/50 rounded-lg border border-aroraborder flex items-center justify-between">
                        <div>
                          <span className="text-[10px] font-mono uppercase text-subtext block">
                            ROOM PASSWORD
                          </span>
                          <span className="font-mono text-2xl font-bold text-cyan tracking-wider">
                            {room.room_password}
                          </span>
                        </div>
                        <button
                          onClick={() => copyToClipboard(room.room_password!, `pass-${room.match_id}`)}
                          className="p-2 text-subtext hover:text-cyan hover:bg-midnight rounded-lg transition-colors"
                          title="Copy Password"
                        >
                          <Copy className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    {copiedKey && (
                      <p className="text-xs text-neongreen font-mono text-center animate-pulse">
                        Copied to clipboard!
                      </p>
                    )}

                    <div className="p-3 bg-deepteal/30 rounded-lg text-xs text-subtext leading-relaxed border border-aroraborder/50">
                      <strong>Lobby Protocol:</strong> Squad Captain must instruct all 4 registered squad members to join custom room slot <strong className="text-neongreen">#{room.slot_number}</strong> immediately. Late entrants after match launch will forfeit.
                    </div>
                  </div>
                ) : (
                  <div className="bg-midnight/70 border border-aroraborder rounded-xl p-8 text-center space-y-4">
                    <div className="w-12 h-12 rounded-full bg-deepteal border border-amber-500/40 flex items-center justify-center mx-auto text-amber-400">
                      <Lock className="w-6 h-6" />
                    </div>
                    <h3 className="font-heading text-lg font-bold uppercase text-icewhite">
                      Room Credentials Sealed
                    </h3>
                    <p className="text-xs text-subtext max-w-md mx-auto leading-relaxed">
                      Custom room credentials are not released in advance to prevent unauthorized lobby joining. Tournament organizers will manually click "SEND MATCH CREDENTIALS" at the 10-minute countdown mark.
                    </p>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-deepteal text-[11px] font-mono text-cyan">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Check back 10 minutes prior to match schedule</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={DoorOpen}
          title="No Active Match Rooms"
          description="You do not have any confirmed tournament registrations with upcoming custom room schedules."
          actionText="View Open Tournaments"
          onAction={() => (window.location.href = '/tournaments')}
        />
      )}
    </div>
  );
};
