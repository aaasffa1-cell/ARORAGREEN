import React, { useEffect, useState } from 'react';
import { Timer, Flame, CheckCircle, Radio } from 'lucide-react';

interface TournamentStopwatchProps {
  targetTime: string | Date;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  compact?: boolean;
}

export const TournamentStopwatch: React.FC<TournamentStopwatchProps> = ({
  targetTime,
  label,
  size = 'md',
  compact = false,
}) => {
  const [timeLeft, setTimeLeft] = useState<{
    diffMs: number;
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isT10: boolean;
    isLive: boolean;
    isPast: boolean;
  }>({
    diffMs: 0,
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isT10: false,
    isLive: false,
    isPast: false,
  });

  useEffect(() => {
    const calculate = () => {
      const targetMs = new Date(targetTime).getTime();
      const nowMs = Date.now();
      const diffMs = targetMs - nowMs;

      const isLive = diffMs <= 0 && diffMs >= -3 * 60 * 60 * 1000; // Live for 3 hours after start
      const isPast = diffMs < -3 * 60 * 60 * 1000;
      const isT10 = diffMs > 0 && diffMs <= 10 * 60 * 1000;

      const absDiff = Math.abs(diffMs);
      const days = Math.floor(absDiff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((absDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((absDiff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((absDiff % (1000 * 60)) / 1000);

      setTimeLeft({
        diffMs,
        days,
        hours,
        minutes,
        seconds,
        isT10,
        isLive,
        isPast,
      });
    };

    calculate();
    const interval = setInterval(calculate, 1000);
    return () => clearInterval(interval);
  }, [targetTime]);

  const pad = (n: number) => String(n).padStart(2, '0');

  // Completed State
  if (timeLeft.isPast) {
    return (
      <span className="inline-flex items-center gap-1 font-mono text-xs text-subtext bg-deepteal/40 px-2 py-0.5 rounded border border-aroraborder">
        <CheckCircle className="w-3.5 h-3.5 text-gray-400" />
        <span>Match Ended</span>
      </span>
    );
  }

  // Live in Progress State
  if (timeLeft.isLive) {
    return (
      <span className="inline-flex items-center gap-1.5 font-mono text-xs font-bold text-red-400 bg-red-950/70 px-2.5 py-1 rounded border border-red-500/50 animate-pulse">
        <Radio className="w-3.5 h-3.5 text-red-400" />
        <span>LIVE NOW (+{pad(timeLeft.minutes)}:{pad(timeLeft.seconds)})</span>
      </span>
    );
  }

  // Final 10-Minute Window State (T-10m)
  if (timeLeft.isT10) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 font-mono font-bold text-neongreen bg-emerald-950/90 px-2.5 py-1 rounded border border-neongreen shadow-neon animate-pulse ${
          size === 'lg' ? 'text-sm' : 'text-xs'
        }`}
        title="Final 10-Minute Window is ACTIVE! Match Room credentials can now be released."
      >
        <Flame className="w-3.5 h-3.5 text-neongreen" />
        <span>
          T-10m ACTIVE: {pad(timeLeft.minutes)}:{pad(timeLeft.seconds)}
        </span>
      </span>
    );
  }

  // Standard Future Countdown (Stopwatch)
  const timeFormatted = `${
    timeLeft.days > 0 ? `${timeLeft.days}d ` : ''
  }${pad(timeLeft.hours)}:${pad(timeLeft.minutes)}:${pad(timeLeft.seconds)}`;

  if (compact) {
    return (
      <span className="inline-flex items-center gap-1 font-mono text-xs text-cyan bg-deepteal/50 px-2 py-0.5 rounded border border-aroraborder">
        <Timer className="w-3 h-3 text-cyan" />
        <span>{timeFormatted}</span>
      </span>
    );
  }

  return (
    <div
      className={`inline-flex items-center gap-2 font-mono bg-midnight px-2.5 py-1 rounded-lg border border-aroraborder shadow-sm ${
        size === 'lg' ? 'text-sm' : 'text-xs'
      }`}
    >
      <Timer className="w-3.5 h-3.5 text-cyan animate-spin-slow" />
      {label && <span className="text-subtext text-[11px] uppercase">{label}:</span>}
      <span className="font-bold text-icewhite tracking-wider">{timeFormatted}</span>
    </div>
  );
};
