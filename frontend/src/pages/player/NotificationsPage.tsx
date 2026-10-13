import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { NotificationItem } from '../../types';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { Bell, Check, ExternalLink } from 'lucide-react';

export const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadNotifications = () => {
    setLoading(true);
    api.notifications
      .get()
      .then((res) => setNotifications(res.notifications || []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleMarkRead = async (id: string) => {
    try {
      await api.notifications.markRead(id);
      setNotifications(
        notifications.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.notifications.markAllRead();
      setNotifications(notifications.map((n) => ({ ...n, is_read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-cyan uppercase tracking-widest mb-1">
            <Bell className="w-4 h-4 text-cyan" />
            <span>DISPATCH LOGS</span>
          </div>
          <h1 className="font-heading text-3xl font-extrabold uppercase text-icewhite">
            Notifications &amp; Alerts
          </h1>
          <p className="text-xs text-subtext mt-1">
            Real-time status updates on tournament registrations, payments, and room credentials.
          </p>
        </div>

        {notifications.some((n) => !n.is_read) && (
          <Button variant="outline" size="sm" onClick={handleMarkAllRead}>
            Mark All As Read
          </Button>
        )}
      </div>

      {loading ? (
        <div className="p-8 text-center text-xs text-subtext">Loading notifications...</div>
      ) : notifications.length > 0 ? (
        <div className="space-y-3">
          {notifications.map((item) => (
            <div
              key={item.id}
              className={`p-4 rounded-xl border transition-all flex items-start justify-between gap-4 ${
                item.is_read
                  ? 'bg-deepteal/20 border-aroraborder text-subtext'
                  : 'bg-deepteal/50 border-cyan/40 text-icewhite shadow-sm'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-heading text-sm font-bold uppercase tracking-wider text-icewhite">
                    {item.title}
                  </span>
                  <span className="text-[10px] font-mono text-subtext">
                    {new Date(item.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                  </span>
                </div>
                <p className="text-xs text-subtext leading-relaxed">{item.message}</p>
                {item.link && (
                  <Link
                    to={item.link}
                    className="inline-flex items-center gap-1 text-xs text-cyan hover:text-neongreen font-mono pt-1 transition-colors"
                  >
                    <span>View Details</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                )}
              </div>

              {!item.is_read && (
                <button
                  onClick={() => handleMarkRead(item.id)}
                  className="p-1.5 text-subtext hover:text-neongreen rounded-lg transition-colors flex-shrink-0"
                  title="Mark read"
                >
                  <Check className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Bell}
          title="No Notifications"
          description="Your notifications feed is currently empty. Critical match room credentials and payment alerts will appear here."
        />
      )}
    </div>
  );
};
