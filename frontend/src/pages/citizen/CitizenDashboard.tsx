import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { issueService } from '../../services/issueService';
import { notificationService } from '../../services/notificationService';
import { useAuth } from '../../context/AuthContext';
import { Issue, Notification } from '../../types';
import { StatCard } from '../../components/common/StatCard';
import { IssueCard } from '../../components/citizen/IssueCard';
import { DemoBadge } from '../../components/common/DemoBadge';
import { LoadingState } from '../../components/common/LoadingState';
import { PlusCircle, FileText, CheckCircle2, Bell, AlertTriangle, ArrowRight, ShieldCheck } from 'lucide-react';

export const CitizenDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      issueService.getIssues(),
      notificationService.getNotifications(currentUser.id, 'Citizen'),
    ]).then(([allIssues, notifs]) => {
      setIssues(allIssues);
      setNotifications(notifs);
      setLoading(false);
    });
  }, [currentUser.id]);

  if (loading) return <LoadingState message="Loading citizen dashboard..." />;

  const myIssues = issues.filter((i) => i.report.citizenId === currentUser.id || i.report.citizenName === currentUser.name);
  const activeCount = myIssues.filter((i) => !['Resolved', 'Rejected', 'Duplicate'].includes(i.status)).length;
  const resolvedCount = myIssues.filter((i) => i.status === 'Resolved').length;
  const verificationCount = issues.filter((i) => i.status === 'Resolution Submitted' || i.status === 'Awaiting Verification').length;
  const unreadNotifCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="space-y-6">
      {/* Welcome & Quick Report Action */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-md">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded bg-blue-800 text-sky-200 border border-blue-700">
              Citizen Portal
            </span>
            <DemoBadge label="Mumbai Ward H/West" />
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Welcome back, {currentUser.name}!
          </h1>
          <p className="text-xs md:text-sm text-slate-300 max-w-xl">
            Report civic issues, track real-time resolution progress, and verify municipal repair quality in your ward.
          </p>
        </div>

        <Link
          to="/citizen/report"
          className="px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2 text-sm shrink-0 w-full md:w-auto justify-center"
        >
          <PlusCircle className="w-5 h-5" /> Report Civic Issue Now
        </Link>
      </div>

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Active Reports"
          value={activeCount}
          subtitle="In progress or under review"
          icon={FileText}
          variant="accent"
        />
        <StatCard
          title="Resolved Fixes"
          value={resolvedCount}
          subtitle="Verified by citizens"
          icon={CheckCircle2}
          variant="success"
        />
        <StatCard
          title="Awaiting Verification"
          value={verificationCount}
          subtitle="Requires citizen audit"
          icon={ShieldCheck}
          variant="warning"
        />
        <StatCard
          title="Unread Alerts"
          value={unreadNotifCount}
          subtitle="Status updates"
          icon={Bell}
          variant="default"
        />
      </div>

      {/* Notification Preview Banner */}
      {notifications.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 text-amber-800 rounded-lg shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-amber-900">{notifications[0].title}</h4>
              <p className="text-xs text-amber-800">{notifications[0].message}</p>
            </div>
          </div>
          <Link
            to="/citizen/notifications"
            className="text-xs font-bold text-amber-900 hover:underline shrink-0 flex items-center gap-1"
          >
            View All Notifications ({notifications.length}) <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Recent Issues */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Recent Reported Complaints</h2>
            <Link to="/citizen/issues" className="text-xs font-semibold text-blue-700 hover:underline flex items-center gap-1">
              View All Complaints <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-4">
            {issues.slice(0, 3).map((issue) => (
              <IssueCard key={issue.id} issue={issue} />
            ))}
          </div>
        </div>

        {/* Right Column: Quick Links & Ward Stats */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900">Quick Portal Shortcuts</h3>
            <div className="space-y-2 text-xs">
              <Link
                to="/citizen/report"
                className="p-3 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 rounded-lg flex items-center justify-between transition-colors group"
              >
                <div className="flex items-center gap-2">
                  <PlusCircle className="w-4 h-4 text-blue-700" />
                  <span className="font-semibold text-slate-800 group-hover:text-blue-900">File New Complaint</span>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-700" />
              </Link>
              <Link
                to="/citizen/nearby"
                className="p-3 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 rounded-lg flex items-center justify-between transition-colors group"
              >
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span className="font-semibold text-slate-800 group-hover:text-blue-900">Explore Nearby Issues</span>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-700" />
              </Link>
              <Link
                to="/citizen/map"
                className="p-3 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 rounded-lg flex items-center justify-between transition-colors group"
              >
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-600" />
                  <span className="font-semibold text-slate-800 group-hover:text-blue-900">Interactive Ward Map</span>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-700" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
