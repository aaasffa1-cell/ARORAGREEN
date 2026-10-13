import React from 'react';
import { Shield } from 'lucide-react';

export const PrivacyPolicy: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div>
        <div className="flex items-center gap-2 text-xs font-mono text-cyan uppercase tracking-widest mb-1">
          <Shield className="w-4 h-4 text-cyan" />
          <span>DATA SECURITY COMMITMENT</span>
        </div>
        <h1 className="font-heading text-4xl font-extrabold uppercase tracking-wide text-icewhite">
          Privacy Policy
        </h1>
        <p className="text-xs text-subtext mt-1">Last Updated: October 2026</p>
      </div>

      <div className="bg-deepteal/30 border border-aroraborder rounded-xl p-8 space-y-6 text-sm text-subtext leading-relaxed">
        <section className="space-y-2">
          <h2 className="font-heading text-lg font-bold uppercase text-icewhite">1. Overview</h2>
          <p>
            ARORA ESPORTS values your privacy and is dedicated to collecting only the minimum personal data required to conduct fair competitive gaming tournaments.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-heading text-lg font-bold uppercase text-icewhite">2. Information Collected</h2>
          <p>
            We collect your email address for passwordless OTP authentication, your squad player details (Free Fire IGN and UID), and submitted UPI transaction reference numbers (UTRs) to reconcile tournament entry fees. We do not store banking passwords, UPI PINs, or raw OTP codes in plaintext.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-heading text-lg font-bold uppercase text-icewhite">3. Session &amp; Cookie Security</h2>
          <p>
            Our service utilizes secure HTTP-only session cookies to maintain your login session. We do not store authentication credentials or access tokens in localStorage, preventing third-party script exploitation.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-heading text-lg font-bold uppercase text-icewhite">4. Data Sharing &amp; Third Parties</h2>
          <p>
            We never sell, rent, or distribute player data. Email addresses are used strictly for OTP codes, match room credential distribution, and essential payment status notifications.
          </p>
        </section>
      </div>
    </div>
  );
};
