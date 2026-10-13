import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';

interface FaqItem {
  question: string;
  answer: string;
}

const faqs: FaqItem[] = [
  {
    question: 'How do I register my 4-player squad for a tournament?',
    answer:
      'Log in using our passwordless email OTP system, navigate to "My Squad", and register your squad name alongside your 3 teammates\' Free Fire In-Game Names (IGNs) and Player UIDs. Once your squad has all 4 members filled, browse our Tournaments page and click "Register Squad".',
  },
  {
    question: 'How does the Manual UPI Payment verification work?',
    answer:
      'When you register for a paid tournament, the official ARORA ESPORTS UPI QR code and UPI ID will be displayed. Pay the exact tournament entry fee using any UPI app (GPay, PhonePe, Paytm), copy the 12-digit UTR/Reference number from your payment receipt, and submit it. Our tournament admin verifies the credit with our bank and marks your status as "Verified", confirming your slot.',
  },
  {
    question: 'When and how will I receive the custom match room credentials?',
    answer:
      'Match room credentials (Room ID and Room Password) are sent out manually by tournament organizers exactly 10 minutes prior to match schedule. Verified squad captains receive an email notification via Gmail and can also view the revealed Room ID & Password directly in their "Match Room" dashboard tab.',
  },
  {
    question: 'Are emulators (PC/Laptop) or iPad/Tablets allowed?',
    answer:
      'No. ARORA ESPORTS tournaments are strictly mobile-only (Android and iOS smartphones). Any player detected on an emulator or utilizing illegal key-mapping peripherals will have their squad instantly disqualified without refund.',
  },
  {
    question: 'What should I do if my payment submission is rejected?',
    answer:
      'If your payment was rejected, check the rejection reason provided in your "My Payments" dashboard tab. Common reasons include entering a mistyped UTR number or sending an incorrect amount. You can re-submit the corrected transaction reference or contact our support team immediately.',
  },
  {
    question: 'How and when are cash prize pools disbursed to winners?',
    answer:
      'Official match outcomes and final point standings are reviewed and published under the "Results" section within 1-2 hours of match completion. Winning squad captains receive their prize payout directly to their verified UPI ID within 24 hours.',
  },
  {
    question: 'Can I replace a teammate after submitting registration?',
    answer:
      'Roster adjustments can be made up until 2 hours before the tournament registration deadline. After the deadline passes or room credentials have been generated, rosters are strictly locked.',
  },
];

export const Faq: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      <div>
        <div className="flex items-center gap-2 text-xs font-mono text-cyan uppercase tracking-widest mb-1">
          <HelpCircle className="w-4 h-4 text-cyan" />
          <span>HELP &amp; CLARIFICATIONS</span>
        </div>
        <h1 className="font-heading text-4xl font-extrabold uppercase tracking-wide text-icewhite">
          Frequently Asked Questions
        </h1>
        <p className="text-sm text-subtext mt-1">
          Everything you need to know about Free Fire tournaments, rosters, payments, and room credentials.
        </p>
      </div>

      <div className="space-y-4">
        {faqs.map((faq, index) => {
          const isOpen = openIndex === index;
          return (
            <div
              key={index}
              className="bg-deepteal/40 border border-aroraborder rounded-xl overflow-hidden transition-all duration-200"
            >
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? null : index)}
                className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-deepteal/60 transition-colors"
                aria-expanded={isOpen}
              >
                <span className="font-heading text-base sm:text-lg font-bold text-icewhite pr-4">
                  {faq.question}
                </span>
                <span className="text-cyan flex-shrink-0">
                  {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </span>
              </button>

              {isOpen && (
                <div className="px-6 pb-5 pt-1 text-xs sm:text-sm text-subtext leading-relaxed border-t border-aroraborder/50">
                  {faq.answer}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
