import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { notificationService } from '../../services/notificationService';
import { useAuth } from '../../context/AuthContext';
import { Notification } from '../../types';
import { DemoBadge } from '../../components/common/DemoBadge';
import { LoadingState } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';
import { Bell, CheckCheck, AlertTriangle, ShieldCheck, Info, ArrowRight } from 'lucide-react';

export const CitizenNotifications: React.FC = () => {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'All' | 'Unread'>('All');

  useEffect(() => {
    notificationService.getNotifications(currentUser.id, 'Citizen').then((data) => {
      setNotifications(data);
      setLoading(false);
    });
  }, [currentUser.id]);

  const handleMarkAsRead = async (id: string) => {
    await notificationService.markAsRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const handleMarkAllRead = async () => {
    await notificationService.markAllAsRead(currentUser.id);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  if (loading) return <LoadingState message="Fetching notifications..." />;

  const filteredNotifs = notifications.filter((n) => (filter === 'Unread' ? !n.read : true));

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header Bar */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl font-bold text-slate-900">Notifications & Dispatch Alerts</h1>
            <DemoBadge label="Real-time Dispatch" />
          </div>
          <p className="text-xs text-slate-500">
            Automated status updates, field assignment dispatches, and verification audit requests.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-slate-100 p-1 rounded-lg text-xs font-semibold">
            <button
              onClick={() => setFilter('All')}
              className={`px-3 py-1 rounded transition-colors ${
                filter === 'All' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600'
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setFilter('Unread')}
              className={`px-3 py-1 rounded transition-colors ${
                filter === 'Unread' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600'
              }`}
            >
              Unread ({notifications.filter((n) => !n.read).length})
            </button>
          </div>

          {notifications.some((n) => !n.read) && (
            <button
              onClick={handleMarkAllRead}
              className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 shrink-0"
            >
              <CheckCheck className="w-3.5 h-3.5" /> Mark All Read
            </button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      {filteredNotifs.length > 0 ? (
        <div className="space-y-3">
          {filteredNotifs.map((n) => {
            return (
              <div
                key={n.id}
                className={`p-4 rounded-xl border transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                  !n.read
                    ? 'bg-blue-50/40 border-blue-200 shadow-xs'
                    : 'bg-white border-slate-200 opacity-90'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`p-2.5 rounded-lg shrink-0 mt-0.5 ${
                      n.type === 'VerificationRequest'
                        ? 'bg-emerald-100 text-emerald-800'
                        : n.type === 'Alert'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {n.type === 'VerificationRequest' ? (
                      <ShieldCheck className="w-5 h-5" />
                    ) : n.type === 'Alert' ? (
                      <AlertTriangle className="w-5 h-5" />
                    ) : (
                      <Info className="w-5 h-5" />
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-900">{n.title}</h4>
                      {!n.read && (
                        <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                      )}
                    </div>
                    <p className="text-xs text-slate-600">{n.message}</p>
                    <span className="text-[10px] text-slate-400 font-mono block">
                      {new Date(n.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                  {n.issueId && (
                    <Link
                      to={`/citizen/issues/${n.issueId}`}
                      className="px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1"
                    >
                      View Complaint <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  )}
                  {!n.read && (
                    <button
                      onClick={() => handleMarkAsRead(n.id)}
                      className="px-2.5 py-1.5 text-xs text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg bg-white"
                    >
                      Dismiss
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={Bell}
          title="No notifications found"
          description="You are all caught up! New status changes and verification requests will appear here."
        />
      )}
    </div>
  );
};
