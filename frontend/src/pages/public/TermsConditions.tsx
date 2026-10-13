import React from 'react';
import { FileCheck } from 'lucide-react';

export const TermsConditions: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div>
        <div className="flex items-center gap-2 text-xs font-mono text-neongreen uppercase tracking-widest mb-1">
          <FileCheck className="w-4 h-4 text-neongreen" />
          <span>LEGAL AGREEMENT</span>
        </div>
        <h1 className="font-heading text-4xl font-extrabold uppercase tracking-wide text-icewhite">
          Terms &amp; Conditions
        </h1>
        <p className="text-xs text-subtext mt-1">Last Updated: October 2026</p>
      </div>

      <div className="bg-deepteal/30 border border-aroraborder rounded-xl p-8 space-y-6 text-sm text-subtext leading-relaxed">
        <section className="space-y-2">
          <h2 className="font-heading text-lg font-bold uppercase text-icewhite">1. Agreement to Terms</h2>
          <p>
            By accessing ARORA ESPORTS or participating in any Free Fire tournament, you agree to be bound by these Terms and our official Tournament Rulebook.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-heading text-lg font-bold uppercase text-icewhite">2. Tournament Registration &amp; UPI Payments</h2>
          <p>
            Submitting a UPI transaction reference number (UTR) does not automatically confirm your slot. All payments are manually verified by tournament organizers against actual banking credits. Submitting fraudulent or forged UTR numbers will lead to permanent platform ban.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-heading text-lg font-bold uppercase text-icewhite">3. Refund Policy</h2>
          <p>
            Entry fees are non-refundable once a squad is confirmed, except in the event that the tournament is officially cancelled by ARORA ESPORTS administration.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-heading text-lg font-bold uppercase text-icewhite">4. Anti-Cheat and Fair Play Enforcement</h2>
          <p>
            ARORA ESPORTS strictly bans emulators, scripts, wall-hacks, and any external assist utilities. Disqualified squads forfeit any claim to entry fees or prize winnings.
          </p>
        </section>
      </div>
    </div>
  );
};
