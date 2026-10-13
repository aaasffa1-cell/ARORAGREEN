import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Tournament } from '../../types';
import { api } from '../../services/api';
import { TournamentCard } from '../../components/ui/TournamentCard';
import { EmptyState } from '../../components/ui/EmptyState';
import {
  Trophy,
  Swords,
  ShieldCheck,
  Users,
  Flame,
  ArrowRight,
  QrCode,
  Zap,
  CheckCircle,
  HelpCircle,
  Mail,
} from 'lucide-react';

export const Home: React.FC = () => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.tournaments
      .list()
      .then((res) => {
        setTournaments(res.tournaments);
      })
      .catch((err) => {
        console.error('Failed to load tournaments', err);
      })
      .finally(() => setLoading(false));
  }, []);

  const openTournaments = tournaments.filter((t) => t.status === 'Registration Open');
  const liveTournaments = tournaments.filter((t) => t.status === 'Live');
  const upcomingTournaments = tournaments.filter(
    (t) => t.status === 'Published' || (t.status === 'Registration Closed' && new Date(t.match_time) > new Date())
  );
  const completedTournaments = tournaments.filter((t) => t.status === 'Completed');

  return (
    <div className="space-y-24 pb-16">
      {/* 1. Cinematic Hero Section */}
      <section className="relative min-h-[85vh] flex items-center justify-center bg-midnight bg-grid-pattern overflow-hidden pt-12 pb-20">
        {/* Glow Spheres */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-neongreen/15 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-80 h-80 bg-cyan/15 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-deepteal/80 border border-neongreen/40 text-neongreen text-xs font-mono uppercase tracking-widest shadow-neon animate-pulse">
            <Flame className="w-3.5 h-3.5 text-neongreen" />
            <span>Official Free Fire Squad Arena</span>
          </div>

          {/* Headline */}
          <h1 className="font-heading text-4xl sm:text-6xl lg:text-7xl font-extrabold uppercase tracking-tight text-icewhite leading-[1.05]">
            DOMINATE THE <span className="text-neongreen glow-green">BERMUDA</span> BATTLEFIELD.
          </h1>

          <p className="text-base sm:text-lg text-subtext max-w-2xl mx-auto leading-relaxed">
            ARORA ESPORTS brings verified 4-player squad tournaments to Free Fire competitors.
            Compete for cash prize pools with auditable manual UPI verification, strict anti-cheat rules, and private custom rooms.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link
              to="/tournaments"
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-neongreen hover:bg-emerald-400 text-midnight font-heading font-extrabold text-base tracking-wider uppercase transition-all shadow-neon hover:shadow-[0_0_25px_rgba(0,245,160,0.5)] flex items-center justify-center gap-2"
            >
              <Trophy className="w-5 h-5 text-midnight" />
              <span>Explore Tournaments</span>
            </Link>

            <Link
              to="/player/my-squad"
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-deepteal hover:bg-deepteal/80 text-icewhite border border-cyan/40 hover:border-cyan font-heading font-bold text-base tracking-wider uppercase transition-all flex items-center justify-center gap-2"
            >
              <Users className="w-5 h-5 text-cyan" />
              <span>Register Your Squad</span>
            </Link>
          </div>

          {/* Trust Highlights */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-8 border-t border-aroraborder/60 max-w-3xl mx-auto text-left">
            <div className="p-3 bg-deepteal/40 rounded-lg border border-aroraborder/40">
              <span className="text-xs text-subtext block font-mono">Format</span>
              <span className="font-heading text-sm font-bold text-icewhite">4-Player Squads</span>
            </div>
            <div className="p-3 bg-deepteal/40 rounded-lg border border-aroraborder/40">
              <span className="text-xs text-subtext block font-mono">Anti-Cheat</span>
              <span className="font-heading text-sm font-bold text-neongreen">Mobile Only (No PC)</span>
            </div>
            <div className="p-3 bg-deepteal/40 rounded-lg border border-aroraborder/40">
              <span className="text-xs text-subtext block font-mono">Room Dispatch</span>
              <span className="font-heading text-sm font-bold text-cyan">T-10 Min Release</span>
            </div>
            <div className="p-3 bg-deepteal/40 rounded-lg border border-aroraborder/40">
              <span className="text-xs text-subtext block font-mono">Verification</span>
              <span className="font-heading text-sm font-bold text-icewhite">Manual UPI Escrow</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Live Tournaments Section (When Applicable) */}
      {liveTournaments.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-6">
            <span className="w-3 h-3 rounded-full bg-red-500 animate-ping" />
            <h2 className="font-heading text-2xl font-bold uppercase tracking-wider text-icewhite">
              Live In Combat
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {liveTournaments.map((t) => (
              <TournamentCard key={t.id} tournament={t} />
            ))}
          </div>
        </section>
      )}

      {/* 3. Open Registration Tournaments */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-neongreen uppercase tracking-widest mb-1">
              <Zap className="w-4 h-4 text-neongreen" />
              <span>Available Slots</span>
            </div>
            <h2 className="font-heading text-3xl font-extrabold uppercase tracking-wide text-icewhite">
              Open Registration Tournaments
            </h2>
          </div>
          <Link
            to="/tournaments?status=Registration Open"
            className="text-sm font-heading font-bold text-cyan hover:text-neongreen flex items-center gap-1.5 transition-colors"
          >
            <span>View All Open</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-72 rounded-xl bg-deepteal/30 border border-aroraborder animate-pulse" />
            ))}
          </div>
        ) : openTournaments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {openTournaments.map((t) => (
              <TournamentCard key={t.id} tournament={t} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Trophy}
            title="No Open Registrations At This Moment"
            description="All active tournaments are currently filled or in preparation. Check upcoming schedules or check back soon."
            actionText="Browse Upcoming Schedules"
            onAction={() => (window.location.href = '/tournaments')}
          />
        )}
      </section>

      {/* 4. Upcoming Tournaments */}
      {upcomingTournaments.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="font-heading text-3xl font-extrabold uppercase tracking-wide text-icewhite">
                Upcoming Schedules
              </h2>
              <p className="text-xs text-subtext mt-1">Tournaments preparing to open registration.</p>
            </div>
            <Link
              to="/tournaments"
              className="text-sm font-heading font-bold text-cyan hover:text-neongreen flex items-center gap-1.5"
            >
              <span>Explore All</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {upcomingTournaments.map((t) => (
              <TournamentCard key={t.id} tournament={t} />
            ))}
          </div>
        </section>
      )}

      {/* 5. How It Works (Four-Player Squad Breakdown) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
          <span className="text-xs font-mono text-cyan uppercase tracking-widest">
            FOUR-PLAYER SQUAD PROCESS
          </span>
          <h2 className="font-heading text-3xl font-extrabold uppercase tracking-wide text-icewhite">
            How To Compete In ARORA ESPORTS
          </h2>
          <p className="text-sm text-subtext">
            Simple 4-step competitive workflow from roster creation to custom room drop.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-deepteal/40 border border-aroraborder p-6 rounded-xl space-y-3 relative">
            <span className="font-heading text-3xl font-extrabold text-neongreen/40">01</span>
            <h3 className="font-heading text-lg font-bold uppercase text-icewhite">Build Squad</h3>
            <p className="text-xs text-subtext leading-relaxed">
              Designate one Captain and add 3 teammates with verified Free Fire In-Game Names (IGN) and Player UIDs.
            </p>
          </div>

          <div className="bg-deepteal/40 border border-aroraborder p-6 rounded-xl space-y-3 relative">
            <span className="font-heading text-3xl font-extrabold text-cyan/40">02</span>
            <h3 className="font-heading text-lg font-bold uppercase text-icewhite">Select &amp; Pay</h3>
            <p className="text-xs text-subtext leading-relaxed">
              Choose an open tournament, scan the verified organizer UPI QR code, and submit your bank transaction reference (UTR).
            </p>
          </div>

          <div className="bg-deepteal/40 border border-aroraborder p-6 rounded-xl space-y-3 relative">
            <span className="font-heading text-3xl font-extrabold text-neongreen/40">03</span>
            <h3 className="font-heading text-lg font-bold uppercase text-icewhite">Admin Escrow</h3>
            <p className="text-xs text-subtext leading-relaxed">
              Tournament administration verifies the transaction manually. Once confirmed, your squad slot is guaranteed.
            </p>
          </div>

          <div className="bg-deepteal/40 border border-aroraborder p-6 rounded-xl space-y-3 relative">
            <span className="font-heading text-3xl font-extrabold text-cyan/40">04</span>
            <h3 className="font-heading text-lg font-bold uppercase text-icewhite">Room Credentials</h3>
            <p className="text-xs text-subtext leading-relaxed">
              At the 10-minute mark before match time, administrators release Room ID &amp; Password directly to verified captains via email &amp; dashboard.
            </p>
          </div>
        </div>
      </section>

      {/* 6. Fair Play & Security Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-deepteal to-midnight border border-aroraborder p-8 sm:p-12 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-4 max-w-xl">
            <div className="inline-flex items-center gap-2 text-xs font-mono text-neongreen">
              <ShieldCheck className="w-4 h-4 text-neongreen" />
              <span>STRICT COMPETITIVE RULES</span>
            </div>
            <h3 className="font-heading text-2xl sm:text-3xl font-extrabold uppercase text-icewhite">
              Mobile Only. Zero Tolerance For Exploits.
            </h3>
            <p className="text-xs sm:text-sm text-subtext leading-relaxed">
              To preserve authentic esports integrity, emulators (BlueStacks, LDPlayer) and modified game clients are strictly prohibited. 
              Violating squads face instant team disqualification and forfeiture of entry fees.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <Link
              to="/rules"
              className="px-6 py-3 rounded-lg bg-deepteal border border-cyan/40 text-cyan hover:border-cyan text-center font-heading font-bold text-sm uppercase tracking-wider"
            >
              Read Rulebook
            </Link>
            <Link
              to="/faq"
              className="px-6 py-3 rounded-lg bg-midnight border border-aroraborder hover:border-neongreen/40 text-icewhite text-center font-heading font-bold text-sm uppercase tracking-wider"
            >
              View FAQ
            </Link>
          </div>
        </div>
      </section>

      {/* 7. Recently Completed Tournaments (if any exist) */}
      {completedTournaments.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-heading text-3xl font-extrabold uppercase tracking-wide text-icewhite">
              Recent Tournaments
            </h2>
            <Link
              to="/results"
              className="text-sm font-heading font-bold text-neongreen hover:underline flex items-center gap-1.5"
            >
              <span>View Leaderboards</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {completedTournaments.slice(0, 3).map((t) => (
              <TournamentCard key={t.id} tournament={t} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
