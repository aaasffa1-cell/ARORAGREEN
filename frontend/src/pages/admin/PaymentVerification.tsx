import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { Payment } from '../../types';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { CreditCard, CheckCircle, XCircle, Clock, AlertTriangle, ShieldCheck } from 'lucide-react';

export const PaymentVerification: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('Pending Verification');

  // Decision Modal State
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [decisionType, setDecisionType] = useState<'Verified' | 'Rejected'>('Verified');
  const [rejectionReason, setRejectionReason] = useState('');
  const [adminNote, setAdminNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const loadPayments = () => {
    setLoading(true);
    api.payments
      .getAdminAll(filterStatus)
      .then((res) => setPayments(res.payments || []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadPayments();
  }, [filterStatus]);

  const openDecisionModal = (payment: Payment, decision: 'Verified' | 'Rejected') => {
    setSelectedPayment(payment);
    setDecisionType(decision);
    setRejectionReason(decision === 'Rejected' ? 'UTR reference could not be located in bank credit log.' : '');
    setAdminNote('');
    setErrorMsg('');
    setSuccessMsg('');
  };

  const handleDecisionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPayment) return;

    setSaving(true);
    setErrorMsg('');

    try {
      await api.payments.reviewDecision(
        selectedPayment.id,
        decisionType,
        adminNote.trim(),
        decisionType === 'Rejected' ? rejectionReason.trim() : undefined
      );

      setSuccessMsg(`Payment successfully marked as ${decisionType}!`);
      setTimeout(() => {
        setSelectedPayment(null);
        loadPayments();
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to record decision.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-cyan uppercase tracking-widest mb-1">
            <CreditCard className="w-4 h-4 text-cyan" />
            <span>MANUAL ESCROW VERIFICATION</span>
          </div>
          <h1 className="font-heading text-3xl font-extrabold uppercase text-icewhite">
            Payment Verification Desk
          </h1>
          <p className="text-xs text-subtext mt-1">
            Independently verify submitted UPI transaction reference numbers against actual organizer bank credits.
          </p>
        </div>

        {/* Filter */}
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-midnight border border-aroraborder rounded-lg px-3 py-2 text-xs text-icewhite focus:outline-none focus:border-cyan"
        >
          <option value="Pending Verification">Pending Verification</option>
          <option value="Verified">Verified Only</option>
          <option value="Rejected">Rejected Only</option>
          <option value="all">All Submissions</option>
        </select>
      </div>

      {loading ? (
        <div className="p-8 text-center text-xs text-subtext">Loading payment submissions...</div>
      ) : payments.length > 0 ? (
        <div className="bg-deepteal/30 border border-aroraborder rounded-xl overflow-hidden shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-midnight/70 text-subtext uppercase font-mono tracking-wider border-b border-aroraborder">
                <tr>
                  <th className="py-3 px-4">Tournament</th>
                  <th className="py-3 px-4">Squad &amp; Captain</th>
                  <th className="py-3 px-4">UTR Reference</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Submitted</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Review Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-aroraborder/50 text-subtext">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-midnight/40">
                    <td className="py-3 px-4 font-heading text-sm font-bold text-icewhite">
                      {p.tournament_title}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-cyan block">{p.squad_name}</span>
                      <span className="text-[11px] text-subtext">{p.captain_name || p.captain_email}</span>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-icewhite">
                      {p.utr}
                    </td>
                    <td className="py-3 px-4 font-mono text-neongreen font-bold">
                      ₹{parseFloat(String(p.amount || 0)).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 font-mono">
                      {new Date(p.submitted_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                    </td>
                    <td className="py-3 px-4">
                      <Badge status={p.status} />
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      {p.status === 'Pending Verification' ? (
                        <>
                          <button
                            onClick={() => openDecisionModal(p, 'Verified')}
                            className="px-2.5 py-1 rounded bg-emerald-950 border border-neongreen text-neongreen text-xs font-mono font-bold hover:bg-emerald-900/40"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => openDecisionModal(p, 'Rejected')}
                            className="px-2.5 py-1 rounded bg-rose-950 border border-rose-500 text-rose-300 text-xs font-mono font-bold hover:bg-rose-900/40"
                          >
                            Reject
                          </button>
                        </>
                      ) : (
                        <span className="text-subtext font-mono text-[11px]">
                          Reviewed by {p.reviewer_name || 'Admin'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="p-8 text-center bg-deepteal/20 border border-aroraborder rounded-xl text-subtext text-xs">
          No payment submissions match the selected status filter.
        </div>
      )}

      {/* Decision Confirmation Modal */}
      <Modal
        isOpen={Boolean(selectedPayment)}
        onClose={() => setSelectedPayment(null)}
        title={`Confirm Payment Decision: ${decisionType}`}
        maxWidth="md"
      >
        {selectedPayment && (
          <form onSubmit={handleDecisionSubmit} className="space-y-4">
            {errorMsg && (
              <div className="p-3 bg-red-950/60 border border-red-500/50 rounded-lg text-xs text-red-200">
                {errorMsg}
              </div>
            )}
            {successMsg && (
              <div className="p-3 bg-emerald-950/60 border border-neongreen/50 rounded-lg text-xs text-neongreen">
                {successMsg}
              </div>
            )}

            <div className="p-3.5 bg-midnight rounded-xl border border-aroraborder space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-subtext">Tournament:</span>
                <span className="text-icewhite font-bold">{selectedPayment.tournament_title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-subtext">Squad:</span>
                <span className="text-cyan font-bold">{selectedPayment.squad_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-subtext">UTR Reference:</span>
                <span className="text-neongreen font-mono font-bold">{selectedPayment.utr}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-subtext">Amount:</span>
                <span className="text-icewhite font-mono">₹{selectedPayment.amount}</span>
              </div>
            </div>

            {decisionType === 'Rejected' && (
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-rose-300">
                  Rejection Reason (Visible to Captain) *
                </label>
                <textarea
                  required
                  rows={2}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full bg-midnight border border-rose-500/50 rounded-lg px-3 py-2 text-xs text-icewhite resize-none"
                />
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-icewhite">
                Internal Audit Note (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Verified in ICICI Current Account at 14:32"
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                className="w-full bg-midnight border border-aroraborder rounded-lg px-3 py-2 text-xs text-icewhite"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="ghost" onClick={() => setSelectedPayment(null)}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant={decisionType === 'Verified' ? 'primary' : 'danger'}
                loading={saving}
              >
                Confirm {decisionType}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
