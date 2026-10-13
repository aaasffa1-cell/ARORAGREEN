import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import {
  Trophy,
  Users,
  CreditCard,
  Calendar,
  History,
  Activity,
  CheckCircle,
  XCircle,
  Clock,
  ClipboardList,
  IndianRupee,
} from 'lucide-react';

export const AdminOverview: React.FC = () => {
  const [data, setData] = useState<{ metrics: any; recent_activity: any[] }>({
    metrics: {
      total_tournaments: 0,
      total_registrations: 0,
      total_squads: 0,
      open_registrations: 0,
      confirmed_squads: 0,
      pending_payments: 0,
      verified_payments: 0,
      rejected_payments: 0,
      total_revenue: 0,
      upcoming_matches: 0,
    },
    recent_activity: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.admin
      .getOverview()
      .then((res) => setData(res))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const { metrics, recent_activity } = data;

  if (loading) {
    return <div className="p-8 text-center text-xs text-subtext">Calculating real-time database metrics...</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-2 text-xs font-mono text-neongreen uppercase tracking-widest mb-1">
          <Activity className="w-4 h-4 text-neongreen" />
          <span>OPERATIONS TELEMETRY</span>
        </div>
        <h1 className="font-heading text-3xl font-extrabold uppercase text-icewhite">
          Admin Overview
        </h1>
        <p className="text-xs text-subtext mt-1">
          Live statistics generated directly from PostgreSQL database entities.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {/* Total Tournaments */}
        <div className="bg-deepteal/40 border border-aroraborder p-5 rounded-xl shadow-card">
          <div className="flex items-center justify-between text-subtext text-xs mb-1 font-mono uppercase">
            <span>Total Tournaments</span>
            <Trophy className="w-4 h-4 text-cyan" />
          </div>
          <span className="font-heading text-3xl font-extrabold text-icewhite">
            {metrics.total_tournaments}
          </span>
          <span className="text-[11px] text-neongreen block mt-1 font-mono">
            {metrics.open_registrations} Open for entry
          </span>
        </div>

        {/* Total Registrations */}
        <div className="bg-deepteal/40 border border-aroraborder p-5 rounded-xl shadow-card">
          <div className="flex items-center justify-between text-subtext text-xs mb-1 font-mono uppercase">
            <span>Total Registrations</span>
            <ClipboardList className="w-4 h-4 text-cyan" />
          </div>
          <span className="font-heading text-3xl font-extrabold text-icewhite">
            {metrics.total_registrations || 0}
          </span>
          <span className="text-[11px] text-subtext block mt-1 font-mono">
            Across all leagues
          </span>
        </div>

        {/* Total Squads */}
        <div className="bg-deepteal/40 border border-aroraborder p-5 rounded-xl shadow-card">
          <div className="flex items-center justify-between text-subtext text-xs mb-1 font-mono uppercase">
            <span>Total Squads</span>
            <Users className="w-4 h-4 text-cyan" />
          </div>
          <span className="font-heading text-3xl font-extrabold text-icewhite">
            {metrics.total_squads || 0}
          </span>
          <span className="text-[11px] text-subtext block mt-1 font-mono">
            Formed teams
          </span>
        </div>

        {/* Confirmed Squads */}
        <div className="bg-deepteal/40 border border-emerald-500/40 p-5 rounded-xl shadow-card">
          <div className="flex items-center justify-between text-emerald-300 text-xs mb-1 font-mono uppercase">
            <span>Confirmed Squads</span>
            <CheckCircle className="w-4 h-4 text-neongreen" />
          </div>
          <span className="font-heading text-3xl font-extrabold text-neongreen">
            {metrics.confirmed_squads}
          </span>
          <span className="text-[11px] text-emerald-400 block mt-1 font-mono">
            Slot guaranteed
          </span>
        </div>

        {/* Total Collections */}
        <div className="bg-deepteal/40 border border-neongreen/40 p-5 rounded-xl shadow-card">
          <div className="flex items-center justify-between text-neongreen text-xs mb-1 font-mono uppercase">
            <span>Total Collections</span>
            <IndianRupee className="w-4 h-4 text-neongreen" />
          </div>
          <span className="font-heading text-3xl font-extrabold text-neongreen">
            ₹{(metrics.total_revenue || 0).toLocaleString('en-IN')}
          </span>
          <span className="text-[11px] text-gray-400 block mt-1 font-mono">
            Verified entry fees
          </span>
        </div>

        {/* Pending Payments */}
        <div className="bg-deepteal/40 border border-amber-500/40 p-5 rounded-xl shadow-card">
          <div className="flex items-center justify-between text-amber-300 text-xs mb-1 font-mono uppercase">
            <span>Pending Payments</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <span className="font-heading text-3xl font-extrabold text-amber-300">
            {metrics.pending_payments}
          </span>
          <span className="text-[11px] text-amber-400/80 block mt-1 font-mono">
            Awaiting bank check
          </span>
        </div>

        {/* Verified Payments */}
        <div className="bg-deepteal/40 border border-aroraborder p-5 rounded-xl shadow-card">
          <div className="flex items-center justify-between text-subtext text-xs mb-1 font-mono uppercase">
            <span>Approved Payments</span>
            <CheckCircle className="w-4 h-4 text-neongreen" />
          </div>
          <span className="font-heading text-3xl font-extrabold text-neongreen">
            {metrics.verified_payments}
          </span>
          <span className="text-[11px] text-subtext block mt-1 font-mono">
            Approved transfers
          </span>
        </div>

        {/* Rejected Payments */}
        <div className="bg-deepteal/40 border border-rose-500/30 p-5 rounded-xl shadow-card">
          <div className="flex items-center justify-between text-rose-300 text-xs mb-1 font-mono uppercase">
            <span>Rejected Payments</span>
            <XCircle className="w-4 h-4 text-rose-400" />
          </div>
          <span className="font-heading text-3xl font-extrabold text-rose-400">
            {metrics.rejected_payments || 0}
          </span>
          <span className="text-[11px] text-rose-400/80 block mt-1 font-mono">
            Invalid UTR / mismatch
          </span>
        </div>

        {/* Upcoming Matches */}
        <div className="bg-deepteal/40 border border-aroraborder p-5 rounded-xl shadow-card">
          <div className="flex items-center justify-between text-subtext text-xs mb-1 font-mono uppercase">
            <span>Upcoming Matches</span>
            <Calendar className="w-4 h-4 text-cyan" />
          </div>
          <span className="font-heading text-3xl font-extrabold text-icewhite">
            {metrics.upcoming_matches}
          </span>
          <span className="text-[11px] text-subtext block mt-1 font-mono">
            Scheduled custom rooms
          </span>
        </div>
      </div>

      {/* Recent Activity Audit Feed */}
      <div className="bg-deepteal/30 border border-aroraborder rounded-xl p-6 space-y-4">
        <h2 className="font-heading text-xl font-bold uppercase tracking-wider text-icewhite flex items-center gap-2">
          <History className="w-5 h-5 text-cyan" />
          Recent Administrative Operations
        </h2>

        {recent_activity.length > 0 ? (
          <div className="space-y-3">
            {recent_activity.map((log) => (
              <div
                key={log.id}
                className="p-3.5 bg-midnight rounded-lg border border-aroraborder flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-neongreen">{log.action}</span>
                    <span className="text-aroraborder">•</span>
                    <span className="text-subtext">Entity: {log.target_entity}</span>
                  </div>
                  <span className="text-[11px] text-gray-400 block mt-0.5">
                    Actor: {log.actor_name || log.actor_email || 'System'}
                  </span>
                </div>
                <span className="font-mono text-gray-500 text-[10px]">
                  {new Date(log.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-subtext italic py-4">No recent administrative operations recorded.</p>
        )}
      </div>
    </div>
  );
};
