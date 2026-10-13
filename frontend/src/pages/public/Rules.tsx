import React from 'react';
import { ShieldCheck, AlertOctagon, Trophy, Smartphone, Swords } from 'lucide-react';

export const Rules: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      <div>
        <div className="flex items-center gap-2 text-xs font-mono text-neongreen uppercase tracking-widest mb-1">
          <ShieldCheck className="w-4 h-4 text-neongreen" />
          <span>OFFICIAL CODE OF CONDUCT</span>
        </div>
        <h1 className="font-heading text-4xl font-extrabold uppercase tracking-wide text-icewhite">
          Tournament Rules &amp; Regulations
        </h1>
        <p className="text-sm text-subtext mt-1">
          Every player and squad captain participating in ARORA ESPORTS must strictly abide by these official guidelines.
        </p>
      </div>

      {/* Highlights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-deepteal/40 border border-aroraborder p-6 rounded-xl space-y-3">
          <Smartphone className="w-6 h-6 text-neongreen" />
          <h3 className="font-heading text-lg font-bold uppercase text-icewhite">Mobile Only</h3>
          <p className="text-xs text-subtext leading-relaxed">
            All players must play on legitimate handheld iOS or Android mobile phones. Emulators, PCs, and mouse/keyboard adapters are strictly prohibited.
          </p>
        </div>

        <div className="bg-deepteal/40 border border-aroraborder p-6 rounded-xl space-y-3">
          <AlertOctagon className="w-6 h-6 text-rose-400" />
          <h3 className="font-heading text-lg font-bold uppercase text-icewhite">Zero Tolerance</h3>
          <p className="text-xs text-subtext leading-relaxed">
            Aimbots, wall-hacks, script alterations, config modding, and teaming with rival squads lead to permanent hardware and UID ban across all tournaments.
          </p>
        </div>

        <div className="bg-deepteal/40 border border-aroraborder p-6 rounded-xl space-y-3">
          <Trophy className="w-6 h-6 text-cyan" />
          <h3 className="font-heading text-lg font-bold uppercase text-icewhite">Point Scoring Matrix</h3>
          <p className="text-xs text-subtext leading-relaxed">
            Official BRS scoring: 1st (12 pts), 2nd (9 pts), 3rd (8 pts), 4th (7 pts), 5th (6 pts), 6th (5 pts), 7th (4 pts), 8th (3 pts), 9th (2 pts), 10th (1 pt). Each kill = 1 pt.
          </p>
        </div>
      </div>

      {/* Sections */}
      <div className="bg-deepteal/30 border border-aroraborder rounded-xl p-8 space-y-8 text-sm text-subtext leading-relaxed">
        <section className="space-y-3">
          <h2 className="font-heading text-2xl font-bold uppercase text-icewhite flex items-center gap-2">
            <span className="text-neongreen">1.</span> Squad Eligibility &amp; Roster Compliance
          </h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Each squad must register with exactly 4 verified players (1 Team Captain and 3 Teammates).</li>
            <li>All players must have a minimum Free Fire Level of 40 and rank Diamond I or higher in BR-Ranked.</li>
            <li>Players may not represent more than one squad during the same tournament schedule.</li>
            <li>In-game nicknames and UIDs must exactly match the registered roster details. Roster changes within 2 hours of match time are void.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="font-heading text-2xl font-bold uppercase text-icewhite flex items-center gap-2">
            <span className="text-cyan">2.</span> Room Credentials &amp; Match Schedule
          </h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Custom Room ID and Password will be sent to the registered Team Captain at T-10 minutes prior to scheduled start.</li>
            <li>Squads must enter their assigned slot number in the custom room lobby at least 5 minutes prior to start.</li>
            <li>The room will launch precisely at the scheduled time. Unfilled slots will not delay the countdown.</li>
            <li>Sharing credentials with non-registered players will result in instant squad forfeiture.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="font-heading text-2xl font-bold uppercase text-icewhite flex items-center gap-2">
            <span className="text-neongreen">3.</span> Disconnection &amp; Rematch Policy
          </h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Player disconnections caused by individual network failure will not trigger a rematch.</li>
            <li>Rematches are authorized exclusively if the official server crashes or at least 6 squads disconnect simultaneously within 60 seconds of airplane takeoff.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="font-heading text-2xl font-bold uppercase text-icewhite flex items-center gap-2">
            <span className="text-amber-400">4.</span> Disputes &amp; Prize Disbursal
          </h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>All disputes must be submitted by the Team Captain through the Support desk within 15 minutes of match finish, accompanied by continuous screen recordings.</li>
            <li>Cash prizes will be disbursed to the winning Team Captain's verified UPI ID within 24 hours of official results publication.</li>
          </ul>
        </section>
      </div>
    </div>
  );
};
