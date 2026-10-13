import React, { useState } from 'react';
import { api } from '../../services/api';
import { Button } from '../../components/ui/Button';
import { Bell, Send, CheckCircle, AlertTriangle } from 'lucide-react';

export const NotificationManagement: React.FC = () => {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState('Announcement');
  const [link, setLink] = useState('/tournaments');
  const [sending, setSending] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      await api.notifications.broadcast(title.trim(), message.trim(), type, link.trim());
      setSuccessMsg('Broadcast notification successfully dispatched to all active player dashboards!');
      setTitle('');
      setMessage('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to dispatch broadcast.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <div className="flex items-center gap-2 text-xs font-mono text-cyan uppercase tracking-widest mb-1">
          <Bell className="w-4 h-4 text-cyan" />
          <span>BROADCAST DISPATCH</span>
        </div>
        <h1 className="font-heading text-3xl font-extrabold uppercase text-icewhite">
          Notification Management
        </h1>
        <p className="text-xs text-subtext mt-1">
          Send platform announcements, maintenance notices, or tournament registration calls to all registered players.
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

      <form onSubmit={handleBroadcast} className="bg-deepteal/30 border border-aroraborder rounded-xl p-6 space-y-4 shadow-card">
        <div className="space-y-1">
          <label className="text-xs font-bold uppercase text-icewhite">Alert Title *</label>
          <input
            type="text"
            required
            placeholder="e.g. Bermuda Pro Clash Registration Now Open!"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-midnight border border-aroraborder rounded-lg px-3.5 py-2.5 text-sm text-icewhite focus:outline-none focus:border-neongreen"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase text-icewhite">Category</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full bg-midnight border border-aroraborder rounded-lg px-3 py-2 text-xs text-icewhite focus:outline-none"
            >
              <option value="Announcement">Announcement</option>
              <option value="Tournament">Tournament</option>
              <option value="System">System Notice</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold uppercase text-icewhite">Target Link</label>
            <input
              type="text"
              placeholder="/tournaments"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              className="w-full bg-midnight border border-aroraborder rounded-lg px-3 py-2 text-xs text-icewhite"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-bold uppercase text-icewhite">Message Body *</label>
          <textarea
            required
            rows={4}
            placeholder="Enter announcement text to display in player notification feeds..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full bg-midnight border border-aroraborder rounded-lg px-3.5 py-2.5 text-xs text-icewhite focus:outline-none focus:border-cyan resize-none"
          />
        </div>

        <Button type="submit" loading={sending} icon={<Send className="w-4 h-4" />} className="w-full py-3">
          Broadcast Alert To All Players
        </Button>
      </form>
    </div>
  );
};
