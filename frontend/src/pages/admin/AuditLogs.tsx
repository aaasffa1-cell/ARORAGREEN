import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { History, Mail, ShieldCheck, AlertCircle, CheckCircle } from 'lucide-react';
import { Badge } from '../../components/ui/Badge';

export const AuditLogs: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'audit' | 'delivery'>('audit');
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [deliveryLogs, setDeliveryLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    if (activeTab === 'audit') {
      api.admin
        .getAuditLogs()
        .then((res) => setAuditLogs(res.audit_logs || []))
        .catch((err) => console.error(err))
        .finally(() => setLoading(false));
    } else {
      api.admin
        .getDeliveryLogs()
        .then((res) => setDeliveryLogs(res.delivery_logs || []))
        .catch((err) => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [activeTab]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-cyan uppercase tracking-widest mb-1">
            <History className="w-4 h-4 text-cyan" />
            <span>SECURITY &amp; COMPLIANCE LOGS</span>
          </div>
          <h1 className="font-heading text-3xl font-extrabold uppercase text-icewhite">
            Audit &amp; Delivery Tracking
          </h1>
          <p className="text-xs text-subtext mt-1">
            Immutable records of admin operations, payment reviews, and Free Fire room key email dispatch telemetry.
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="flex items-center gap-2 bg-midnight p-1 rounded-lg border border-aroraborder">
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-3 py-1.5 rounded text-xs font-mono font-bold uppercase transition-colors ${
              activeTab === 'audit'
                ? 'bg-deepteal text-neongreen border border-neongreen/40'
                : 'text-subtext hover:text-icewhite'
            }`}
          >
            Admin Trail
          </button>
          <button
            onClick={() => setActiveTab('delivery')}
            className={`px-3 py-1.5 rounded text-xs font-mono font-bold uppercase transition-colors ${
              activeTab === 'delivery'
                ? 'bg-deepteal text-cyan border border-cyan/40'
                : 'text-subtext hover:text-icewhite'
            }`}
          >
            Email Dispatch Logs
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center text-xs text-subtext">Loading log telemetry...</div>
      ) : activeTab === 'audit' ? (
        auditLogs.length > 0 ? (
          <div className="bg-deepteal/30 border border-aroraborder rounded-xl overflow-hidden shadow-card">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-midnight/70 text-subtext uppercase font-mono tracking-wider border-b border-aroraborder">
                  <tr>
                    <th className="py-3 px-4">Timestamp (IST)</th>
                    <th className="py-3 px-4">Action</th>
                    <th className="py-3 px-4">Entity</th>
                    <th className="py-3 px-4">Admin Actor</th>
                    <th className="py-3 px-4">Details / Metadata</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-aroraborder/50 text-subtext">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-midnight/40">
                      <td className="py-3 px-4 font-mono text-gray-400 whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-neongreen">
                        {log.action}
                      </td>
                      <td className="py-3 px-4 font-mono text-cyan">{log.target_entity}</td>
                      <td className="py-3 px-4">
                        <span className="text-icewhite font-semibold block">{log.actor_name || 'Admin'}</span>
                        <span className="text-[10px] text-gray-500 font-mono">{log.actor_email || '-'}</span>
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-gray-300 max-w-xs truncate">
                        {JSON.stringify(log.metadata || {})}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center bg-deepteal/20 border border-aroraborder rounded-xl text-subtext text-xs">
            No audit log entries recorded yet.
          </div>
        )
      ) : deliveryLogs.length > 0 ? (
        <div className="bg-deepteal/30 border border-aroraborder rounded-xl overflow-hidden shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-midnight/70 text-subtext uppercase font-mono tracking-wider border-b border-aroraborder">
                <tr>
                  <th className="py-3 px-4">Dispatch Timestamp</th>
                  <th className="py-3 px-4">Tournament</th>
                  <th className="py-3 px-4">Recipient Captain</th>
                  <th className="py-3 px-4">Delivery Status</th>
                  <th className="py-3 px-4">Error / Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-aroraborder/50 text-subtext">
                {deliveryLogs.map((dl) => (
                  <tr key={dl.id} className="hover:bg-midnight/40">
                    <td className="py-3 px-4 font-mono text-gray-400 whitespace-nowrap">
                      {new Date(dl.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                    </td>
                    <td className="py-3 px-4 font-heading font-bold text-icewhite">
                      {dl.tournament_title || 'Match Room'}
                    </td>
                    <td className="py-3 px-4 font-mono text-cyan">
                      {dl.recipient_email}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                          dl.status === 'Sent'
                            ? 'bg-emerald-950 text-neongreen border border-neongreen/40'
                            : 'bg-rose-950 text-rose-300 border border-rose-500/40'
                        }`}
                      >
                        {dl.status === 'Sent' ? (
                          <CheckCircle className="w-3 h-3" />
                        ) : (
                          <AlertCircle className="w-3 h-3" />
                        )}
                        {dl.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-gray-400 max-w-xs truncate">
                      {dl.error_message || 'Delivered successfully via SMTP'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="p-8 text-center bg-deepteal/20 border border-aroraborder rounded-xl text-subtext text-xs">
          No room credential email dispatch logs recorded yet.
        </div>
      )}
    </div>
  );
};
