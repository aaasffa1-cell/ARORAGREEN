import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { Payment, Registration } from '../../types';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import {
  CreditCard,
  ShieldCheck,
  AlertTriangle,
  CheckCircle,
  Copy,
  Info,
} from 'lucide-react';

export const MyPayments: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [pendingRegistrations, setPendingRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);

  // Quick submit modal/form
  const [selectedRegId, setSelectedRegId] = useState('');
  const [utrInput, setUtrInput] = useState('');
  const [notesInput, setNotesInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [settings, setSettings] = useState<{ upi_id: string; upi_payee_name: string; upi_qr_image_url: string }>({
    upi_id: '9010418179-2.wallet@phonepe',
    upi_payee_name: 'ARORA ESPORTS (PhonePe)',
    upi_qr_image_url: '/assets/phonepe_upi_qr.jpg',
  });

  const loadData = () => {
    setLoading(true);
    Promise.all([
      api.payments.getMyPayments(),
      api.registrations.getMyRegistrations(),
      api.settings.get().catch(() => ({ settings: null })),
    ])
      .then(([payRes, regRes, setRes]) => {
        if (setRes?.settings) {
          setSettings({
            upi_id: setRes.settings.upi_id || '9010418179-2.wallet@phonepe',
            upi_payee_name: setRes.settings.upi_payee_name || 'ARORA ESPORTS (PhonePe)',
            upi_qr_image_url: setRes.settings.upi_qr_image_url || '/assets/phonepe_upi_qr.jpg',
          });
        }
        setPayments(payRes.payments || []);
        const pending = (regRes.registrations || []).filter(
          (r: Registration) => r.registration_status === 'Pending Payment'
        );
        setPendingRegistrations(pending);
        if (pending.length > 0 && !selectedRegId) {
          setSelectedRegId(pending[0].registration_id);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmitUtr = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRegId || !utrInput.trim()) return;

    setErrorMsg('');
    setSuccessMsg('');
    setSubmitting(true);

    try {
      await api.payments.submit(selectedRegId, utrInput.trim(), notesInput.trim());
      setSuccessMsg('Payment reference successfully submitted! Status is now Pending Verification.');
      setUtrInput('');
      setNotesInput('');
      loadData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit payment reference.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-xs text-subtext">Loading payment records...</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-2 text-xs font-mono text-cyan uppercase tracking-widest mb-1">
          <CreditCard className="w-4 h-4 text-cyan" />
          <span>ESCROW AUDIT LOG</span>
        </div>
        <h1 className="font-heading text-3xl font-extrabold uppercase text-icewhite">
          My Tournament Payments
        </h1>
        <p className="text-xs text-subtext mt-1">
          Track manual UPI payment submissions, UTR numbers, and administrative verification status.
        </p>
      </div>

      {/* Prominent Verification Notice */}
      <div className="p-4 bg-deepteal/50 border border-amber-500/40 rounded-xl flex items-start gap-3 text-xs leading-relaxed">
        <Info className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
        <div className="text-subtext">
          <strong className="text-amber-300 block font-heading uppercase text-sm">
            Manual Verification Policy Notice
          </strong>
          Submitting a transaction reference number (UTR) does not itself prove payment. ARORA ESPORTS administrators independently reconcile all incoming credits against actual bank records before granting confirmed slot eligibility.
        </div>
      </div>

      {/* Pending Payment Action Box (if player has pending registrations) */}
      {pendingRegistrations.length > 0 && (
        <div className="bg-deepteal/40 border border-cyan/40 rounded-xl p-6 space-y-6 shadow-card">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-xl font-bold uppercase text-icewhite flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-cyan" />
              Pending Payment Submission
            </h2>
            <span className="text-xs font-mono text-amber-300">Action Required</span>
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-950/60 border border-red-500/50 rounded-lg text-xs text-red-200 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-950/60 border border-neongreen/50 rounded-lg text-xs text-neongreen flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-neongreen flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* QR Code + Form */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 bg-midnight rounded-xl border border-aroraborder text-center space-y-3">
              <img
                src={settings.upi_qr_image_url}
                alt="ARORA ESPORTS UPI QR"
                className="w-36 h-36 mx-auto rounded-lg bg-white p-1 object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/assets/phonepe_upi_qr.jpg';
                }}
              />
              <div className="text-xs">
                <span className="text-subtext block text-[10px] uppercase font-mono">Official Payee</span>
                <span className="font-mono font-bold text-neongreen text-xs">{settings.upi_id}</span>
                <span className="text-[10px] text-cyan block mt-0.5">{settings.upi_payee_name}</span>
              </div>
            </div>

            <form onSubmit={handleSubmitUtr} className="md:col-span-2 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-icewhite">
                  Select Registered Tournament *
                </label>
                <select
                  value={selectedRegId}
                  onChange={(e) => setSelectedRegId(e.target.value)}
                  className="w-full bg-midnight border border-aroraborder rounded-lg px-3 py-2 text-xs text-icewhite focus:outline-none focus:border-cyan"
                >
                  {pendingRegistrations.map((pr) => (
                    <option key={pr.registration_id} value={pr.registration_id}>
                      {pr.tournament_title} — Entry Fee: ₹{pr.entry_fee}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-icewhite">
                  12-Digit UPI Transaction Reference (UTR) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 428198765432"
                  value={utrInput}
                  onChange={(e) => setUtrInput(e.target.value)}
                  className="w-full bg-midnight border border-aroraborder rounded-lg px-3 py-2 text-sm text-icewhite focus:outline-none focus:border-neongreen"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-subtext">Notes / Sender Account Name</label>
                <input
                  type="text"
                  placeholder="e.g. Paid from HDFC UPI app"
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                  className="w-full bg-midnight border border-aroraborder rounded-lg px-3 py-2 text-xs text-icewhite focus:outline-none focus:border-cyan"
                />
              </div>

              <Button type="submit" loading={submitting} className="w-full py-2.5">
                Submit Reference For Manual Verification
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* Payment History Table */}
      <div className="bg-deepteal/30 border border-aroraborder rounded-xl p-6 space-y-4">
        <h2 className="font-heading text-xl font-bold uppercase tracking-wider text-icewhite">
          Payment History
        </h2>

        {payments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-midnight/70 text-subtext uppercase font-mono tracking-wider border-b border-aroraborder">
                <tr>
                  <th className="py-3 px-4">Tournament</th>
                  <th className="py-3 px-4">UTR Reference</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Submitted At</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Review Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-aroraborder/50 text-subtext">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-midnight/40">
                    <td className="py-3.5 px-4 font-heading text-sm font-bold text-icewhite">
                      {p.tournament_title}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-cyan">{p.utr}</td>
                    <td className="py-3.5 px-4 font-mono text-icewhite">
                      ₹{parseFloat(String(p.amount || 0)).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4 font-mono">
                      {new Date(p.submitted_at).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge status={p.status} />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {p.rejection_reason ? (
                        <span className="text-rose-400 font-mono text-[11px]">
                          Rejected: {p.rejection_reason}
                        </span>
                      ) : p.reviewed_at ? (
                        <span className="text-neongreen font-mono text-[11px]">
                          Verified by Admin
                        </span>
                      ) : (
                        <span className="text-amber-300 font-mono text-[11px]">
                          Awaiting bank check
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            icon={CreditCard}
            title="No Payment Submissions Found"
            description="You have not submitted any UPI transaction references yet."
          />
        )}
      </div>
    </div>
  );
};
