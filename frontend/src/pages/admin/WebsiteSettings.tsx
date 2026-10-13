import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { Button } from '../../components/ui/Button';
import { Settings, CheckCircle, AlertTriangle, QrCode } from 'lucide-react';

export const WebsiteSettings: React.FC = () => {
  const [formData, setFormData] = useState({
    upi_id: '9010418179-2.wallet@phonepe',
    upi_payee_name: 'ARORA ESPORTS (PhonePe)',
    upi_qr_image_url: '/assets/phonepe_upi_qr.jpg',
    support_email: 'aaasffa1@gmail.com',
    support_phone: '9010418179',
    support_telegram: 'https://t.me/gaiusmorgan901',
    rules_text: '',
    announcements: '',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    api.settings
      .get()
      .then((res) => {
        if (res.settings) {
          setFormData({
            upi_id: res.settings.upi_id || '9010418179-2.wallet@phonepe',
            upi_payee_name: res.settings.upi_payee_name || 'ARORA ESPORTS (PhonePe)',
            upi_qr_image_url: res.settings.upi_qr_image_url || '/assets/phonepe_upi_qr.jpg',
            support_email: res.settings.support_email || 'aaasffa1@gmail.com',
            support_phone: res.settings.support_phone || '9010418179',
            support_telegram: res.settings.support_telegram || 'https://t.me/gaiusmorgan901',
            rules_text: res.settings.rules_text || '',
            announcements: res.settings.announcements || '',
          });
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      await api.settings.update(formData);
      setSuccessMsg('Website configuration, PhonePe UPI and contact details updated successfully!');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update website settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-xs text-subtext">Loading settings...</div>;
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <div className="flex items-center gap-2 text-xs font-mono text-cyan uppercase tracking-widest mb-1">
          <Settings className="w-4 h-4 text-cyan" />
          <span>PAYMENT GATEWAY &amp; PORTAL PARAMETERS</span>
        </div>
        <h1 className="font-heading text-3xl font-extrabold uppercase text-icewhite">
          Website Settings
        </h1>
        <p className="text-xs text-subtext mt-1">
          Configure authentic UPI ID, payee details, QR code assets, contact info, and site-wide rules.
        </p>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-950/60 border border-neongreen/50 rounded-lg text-xs text-neongreen flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-neongreen" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-red-950/60 border border-red-500/50 rounded-lg text-xs text-red-200 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="bg-deepteal/30 border border-aroraborder rounded-xl p-6 space-y-5 shadow-card">
        {/* UPI Escrow Section */}
        <div className="space-y-4 pb-4 border-b border-aroraborder/60">
          <h3 className="font-heading text-base font-bold uppercase text-neongreen flex items-center gap-2">
            <QrCode className="w-4 h-4" />
            Official UPI Payment Parameters
          </h3>

          <div className="flex flex-col sm:flex-row items-center gap-5 p-4 bg-midnight rounded-xl border border-aroraborder">
            <div className="text-center space-y-2">
              <img
                src={formData.upi_qr_image_url}
                alt="Active UPI QR Code"
                className="w-28 h-28 rounded-lg border border-neongreen/40 bg-white p-1 object-contain mx-auto"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/assets/phonepe_upi_qr.jpg';
                }}
              />
              <span className="text-[10px] font-mono text-cyan block uppercase">Current Active QR</span>
            </div>
            <div className="flex-1 space-y-2 text-xs">
              <div>
                <span className="text-subtext block text-[10px] uppercase font-mono">Configured UPI VPA</span>
                <span className="font-mono font-bold text-icewhite text-sm">{formData.upi_id}</span>
              </div>
              <div>
                <span className="text-subtext block text-[10px] uppercase font-mono">Recipient Payee Name</span>
                <span className="text-neongreen font-semibold">{formData.upi_payee_name}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-icewhite">UPI ID (VPA) *</label>
              <input
                type="text"
                required
                value={formData.upi_id}
                onChange={(e) => setFormData({ ...formData, upi_id: e.target.value })}
                className="w-full bg-midnight border border-aroraborder rounded-lg px-3 py-2 text-xs font-mono text-cyan focus:outline-none focus:border-cyan"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-icewhite">Official Payee Name *</label>
              <input
                type="text"
                required
                value={formData.upi_payee_name}
                onChange={(e) => setFormData({ ...formData, upi_payee_name: e.target.value })}
                className="w-full bg-midnight border border-aroraborder rounded-lg px-3 py-2 text-xs text-icewhite focus:outline-none focus:border-cyan"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold uppercase text-icewhite">QR Code Asset Path *</label>
            <input
              type="text"
              required
              value={formData.upi_qr_image_url}
              onChange={(e) => setFormData({ ...formData, upi_qr_image_url: e.target.value })}
              className="w-full bg-midnight border border-aroraborder rounded-lg px-3 py-2 text-xs font-mono text-subtext focus:outline-none"
            />
          </div>
        </div>

        {/* Support Contacts */}
        <div className="space-y-4 pb-4 border-b border-aroraborder/60">
          <h3 className="font-heading text-base font-bold uppercase text-cyan">
            Support Desk Contacts
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-icewhite">Support Email *</label>
              <input
                type="email"
                required
                value={formData.support_email}
                onChange={(e) => setFormData({ ...formData, support_email: e.target.value })}
                className="w-full bg-midnight border border-aroraborder rounded-lg px-3 py-2 text-xs text-icewhite focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-icewhite">Support Phone</label>
              <input
                type="text"
                value={formData.support_phone}
                onChange={(e) => setFormData({ ...formData, support_phone: e.target.value })}
                className="w-full bg-midnight border border-aroraborder rounded-lg px-3 py-2 text-xs text-icewhite focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-icewhite">Telegram Support URL</label>
              <input
                type="url"
                placeholder="https://t.me/gaiusmorgan901"
                value={formData.support_telegram}
                onChange={(e) => setFormData({ ...formData, support_telegram: e.target.value })}
                className="w-full bg-midnight border border-aroraborder rounded-lg px-3 py-2 text-xs text-cyan focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Banner Announcement */}
        <div className="space-y-1">
          <label className="text-xs font-bold uppercase text-icewhite">Platform Header Announcement</label>
          <input
            type="text"
            value={formData.announcements}
            onChange={(e) => setFormData({ ...formData, announcements: e.target.value })}
            className="w-full bg-midnight border border-aroraborder rounded-lg px-3 py-2 text-xs text-icewhite focus:outline-none"
          />
        </div>

        <Button type="submit" loading={saving} className="w-full py-3">
          Save Settings &amp; UPI Configuration
        </Button>
      </form>
    </div>
  );
};
