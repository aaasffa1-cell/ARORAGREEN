import React, { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Mail, Phone, Clock, MessageSquare, CheckCircle, Headphones } from 'lucide-react';

export const Contact: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    squadName: '',
    category: 'Payment / UTR Verification',
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
      setFormData({
        name: '',
        email: '',
        squadName: '',
        category: 'Payment / UTR Verification',
        message: '',
      });
    }, 1000);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      <div>
        <div className="flex items-center gap-2 text-xs font-mono text-neongreen uppercase tracking-widest mb-1">
          <Headphones className="w-4 h-4 text-neongreen" />
          <span>TOURNAMENT OPS SUPPORT</span>
        </div>
        <h1 className="font-heading text-4xl font-extrabold uppercase tracking-wide text-icewhite">
          Contact &amp; Dispute Desk
        </h1>
        <p className="text-sm text-subtext mt-1">
          Reach our tournament administrators directly for payment verification disputes, match room delays, or rule violations.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Contact Info Cards */}
        <div className="space-y-4">
          <div className="bg-deepteal/40 border border-aroraborder p-5 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-cyan font-mono text-xs uppercase font-bold">
              <MessageSquare className="w-4 h-4 text-cyan" />
              <span>Official Telegram Support</span>
            </div>
            <a
              href="https://t.me/gaiusmorgan901"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-semibold text-cyan hover:underline flex items-center gap-1.5"
            >
              <span>@gaiusmorgan901</span>
              <span className="text-xs bg-cyan/20 border border-cyan/40 px-2 py-0.5 rounded text-cyan">Open Telegram ↗</span>
            </a>
            <p className="text-xs text-subtext">Direct admin desk for instant match room &amp; tournament assistance.</p>
          </div>

          <div className="bg-deepteal/40 border border-aroraborder p-5 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-neongreen font-mono text-xs uppercase font-bold">
              <Mail className="w-4 h-4 text-neongreen" />
              <span>Official Support Email</span>
            </div>
            <a href="mailto:aaasffa1@gmail.com" className="text-sm font-semibold text-icewhite hover:text-neongreen">
              aaasffa1@gmail.com
            </a>
            <p className="text-xs text-subtext">Direct ticketing and dispute reviews for all Free Fire squads.</p>
          </div>

          <div className="bg-deepteal/40 border border-aroraborder p-5 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-amber-400 font-mono text-xs uppercase font-bold">
              <Phone className="w-4 h-4 text-amber-400" />
              <span>Helpline &amp; PhonePe UPI</span>
            </div>
            <p className="text-sm font-semibold text-icewhite font-mono">+91 90104 18179</p>
            <p className="text-xs text-subtext">UPI VPA: <span className="font-mono text-cyan">9010418179-2.wallet@phonepe</span></p>
          </div>
        </div>

        {/* Support Request Form */}
        <div className="md:col-span-2 bg-deepteal/30 border border-aroraborder rounded-xl p-8 shadow-card">
          {submitted ? (
            <div className="py-12 text-center space-y-4">
              <div className="w-14 h-14 bg-emerald-950/80 border border-neongreen rounded-full flex items-center justify-center mx-auto text-neongreen">
                <CheckCircle className="w-8 h-8" />
              </div>
              <h3 className="font-heading text-2xl font-bold uppercase text-icewhite">
                Inquiry Logged Successfully
              </h3>
              <p className="text-xs text-subtext max-w-md mx-auto leading-relaxed">
                Thank you. Your support ticket has been received by the ARORA ESPORTS Operations Team. An administrator will respond shortly.
              </p>
              <Button variant="secondary" onClick={() => setSubmitted(false)}>
                Submit Another Inquiry
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-icewhite">
                    Your Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rahul Sharma"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-midnight border border-aroraborder rounded-lg px-3.5 py-2.5 text-sm text-icewhite focus:outline-none focus:border-neongreen/60"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-icewhite">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. rahul@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-midnight border border-aroraborder rounded-lg px-3.5 py-2.5 text-sm text-icewhite focus:outline-none focus:border-neongreen/60"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-icewhite">
                    Squad Name (If registered)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. TEAM VIPER"
                    value={formData.squadName}
                    onChange={(e) => setFormData({ ...formData, squadName: e.target.value })}
                    className="w-full bg-midnight border border-aroraborder rounded-lg px-3.5 py-2.5 text-sm text-icewhite focus:outline-none focus:border-cyan"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-icewhite">
                    Issue Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-midnight border border-aroraborder rounded-lg px-3 py-2.5 text-sm text-icewhite focus:outline-none focus:border-cyan"
                  >
                    <option value="Payment / UTR Verification">Payment / UTR Verification</option>
                    <option value="Match Room Credentials Delay">Match Room Credentials Delay</option>
                    <option value="Roster / Captain Transfer">Roster / Captain Transfer</option>
                    <option value="Rules & Dispute Filing">Rules &amp; Dispute Filing</option>
                    <option value="Prize Payout Dispute">Prize Payout Dispute</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-icewhite">
                  Detailed Message / Dispute Evidence *
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Describe your issue with transaction UTR numbers or match details..."
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full bg-midnight border border-aroraborder rounded-lg px-3.5 py-2.5 text-sm text-icewhite focus:outline-none focus:border-neongreen/60 resize-none"
                />
              </div>

              <Button type="submit" loading={submitting} className="w-full py-3">
                Send Support Message
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
