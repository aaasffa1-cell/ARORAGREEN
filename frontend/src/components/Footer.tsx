import React from 'react';
import { Link } from 'react-router-dom';
import { BrandLogo } from './BrandLogo';
import { ShieldCheck, Mail, Phone, Award } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-midnight border-t border-aroraborder mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand Info */}
          <div className="space-y-4">
            <BrandLogo size="md" />
            <p className="text-sm text-subtext leading-relaxed">
              ARORA ESPORTS is the competitive tournament platform built for Free Fire squads. 
              Compete in official battle royale leagues with verified manual UPI escrow, audited results, and private custom room scheduling.
            </p>
            <div className="flex items-center gap-2 text-xs text-neongreen font-mono">
              <ShieldCheck className="w-4 h-4 text-neongreen flex-shrink-0" />
              <span>Independent Fair-Play Verified</span>
            </div>
          </div>

          {/* Tournament Hub */}
          <div>
            <h4 className="font-heading text-lg font-bold uppercase tracking-wider text-icewhite mb-4 flex items-center gap-2">
              <Award className="w-4 h-4 text-neongreen" />
              Tournament Hub
            </h4>
            <ul className="space-y-2.5 text-sm text-subtext">
              <li>
                <Link to="/tournaments" className="hover:text-neongreen transition-colors">
                  Upcoming Tournaments
                </Link>
              </li>
              <li>
                <Link to="/player/my-squad" className="hover:text-neongreen transition-colors">
                  Roster Management (4-Player Squads)
                </Link>
              </li>
              <li>
                <Link to="/results" className="hover:text-neongreen transition-colors">
                  Live Standings &amp; Results
                </Link>
              </li>
              <li>
                <Link to="/rules" className="hover:text-neongreen transition-colors">
                  Tournament Rulebook &amp; Scoring
                </Link>
              </li>
            </ul>
          </div>

          {/* Support & Contacts */}
          <div>
            <h4 className="font-heading text-lg font-bold uppercase tracking-wider text-icewhite mb-4">
              Player Assistance
            </h4>
            <ul className="space-y-2.5 text-sm text-subtext">
              <li>
                <Link to="/faq" className="hover:text-cyan transition-colors">
                  Frequently Asked Questions
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-cyan transition-colors">
                  Dispute &amp; Support Desk
                </Link>
              </li>
              <li className="flex items-center gap-2 text-xs pt-1">
                <a
                  href="https://t.me/gaiusmorgan901"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan hover:underline flex items-center gap-1.5"
                >
                  <span className="font-semibold">Telegram Support: @gaiusmorgan901 ↗</span>
                </a>
              </li>
              <li className="flex items-center gap-2 text-xs text-icewhite">
                <Mail className="w-3.5 h-3.5 text-cyan" />
                <a href="mailto:aaasffa1@gmail.com" className="hover:text-neongreen">aaasffa1@gmail.com</a>
              </li>
              <li className="flex items-center gap-2 text-xs text-icewhite">
                <Phone className="w-3.5 h-3.5 text-cyan" />
                <span>+91 90104 18179 (PhonePe UPI)</span>
              </li>
            </ul>
          </div>

          {/* Trust & UPI Notice */}
          <div className="space-y-3 bg-deepteal/50 border border-aroraborder p-4 rounded-xl">
            <h4 className="font-heading text-sm font-bold uppercase tracking-wider text-neongreen">
              Manual Verification Notice
            </h4>
            <p className="text-xs text-subtext leading-relaxed">
              ARORA ESPORTS strictly verifies every incoming UPI transaction reference (UTR) manually against bank records. Submitting an invalid reference results in immediate slot revocation.
            </p>
            <div className="pt-2 border-t border-aroraborder/60 text-[11px] text-gray-500">
              Not affiliated with Garena International. Free Fire is a registered trademark of Garena.
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-aroraborder/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-subtext">
          <p>&copy; {new Date().getFullYear()} ARORA ESPORTS. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link to="/privacy" className="hover:text-icewhite transition-colors">
              Privacy Policy
            </Link>
            <Link to="/terms" className="hover:text-icewhite transition-colors">
              Terms &amp; Conditions
            </Link>
            <Link to="/rules" className="hover:text-icewhite transition-colors">
              Fair Play Guidelines
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
