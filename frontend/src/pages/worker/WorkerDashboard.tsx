import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { issueService } from '../../services/issueService';
import { Issue } from '../../types';
import { IssueStatusBadge } from '../../components/common/IssueStatusBadge';
import { PriorityBadge } from '../../components/common/PriorityBadge';
import { SeverityBadge } from '../../components/common/SeverityBadge';
import { DemoBadge } from '../../components/common/DemoBadge';
import { LoadingState } from '../../components/common/LoadingState';
import { CheckSquare, Clock, CheckCircle2, MapPin, ArrowRight, Wrench, ShieldAlert } from 'lucide-react';
import { getImageUrl, handleImageError } from '../../utils/imageUtils';

export const WorkerDashboard: React.FC = () => {
  const [assignedIssues, setAssignedIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    issueService.getIssues().then((data) => {
      // Filter issues relevant to field workers (Assigned, Work Scheduled, In Progress, Resolution Submitted, Resolved)
      const workerList = data.filter(
        (item) =>
          item.status === 'Assigned' ||
          item.status === 'Work Scheduled' ||
          item.status === 'In Progress' ||
          item.status === 'Resolution Submitted' ||
          item.status === 'Resolved'
      );
      setAssignedIssues(workerList);
      setLoading(false);
    });
  }, []);

  if (loading) return <LoadingState message="Loading worker dashboard..." />;

  const assignedToday = assignedIssues.filter(
    (i) => i.status === 'Assigned' || i.status === 'Work Scheduled'
  );
  const inProgress = assignedIssues.filter((i) => i.status === 'In Progress');
  const completed = assignedIssues.filter(
    (i) => i.status === 'Resolution Submitted' || i.status === 'Resolved'
  );

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6 pb-20 md:pb-6">
      {/* Mobile / Field Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 p-5 rounded-2xl text-white shadow-lg">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider bg-blue-500/30 text-blue-200 px-2.5 py-0.5 rounded-full border border-blue-400/30">
              Field Repair Squad #1
            </span>
            <DemoBadge />
          </div>
          <h1 className="text-xl md:text-2xl font-bold mt-1">Worker Task Center</h1>
          <p className="text-sm text-blue-200/80 mt-0.5">
            Ward 12 (Andheri West) — Roads & Sanitation Unit
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/worker/active"
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-semibold shadow flex items-center gap-2 transition-transform active:scale-95"
          >
            <Wrench className="w-4 h-4" />
            Active Job ({inProgress.length})
          </Link>
        </div>
      </div>

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-3 gap-3 md:gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Assigned Today</span>
            <CheckSquare className="w-5 h-5 text-blue-600" />
          </div>
          <div className="mt-2 text-2xl md:text-3xl font-extrabold text-slate-900">
            {assignedToday.length}
          </div>
          <span className="text-[11px] text-blue-600 font-medium mt-1">Pending Start</span>
        </div>

        <div className="bg-amber-50/60 p-4 rounded-xl border border-amber-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-amber-800">In Progress</span>
            <Clock className="w-5 h-5 text-amber-600" />
          </div>
          <div className="mt-2 text-2xl md:text-3xl font-extrabold text-amber-900">
            {inProgress.length}
          </div>
          <span className="text-[11px] text-amber-700 font-medium mt-1">On-Site Work</span>
        </div>

        <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-emerald-800">Completed</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl md:text-3xl font-extrabold text-emerald-900">
            {completed.length}
          </div>
          <span className="text-[11px] text-emerald-700 font-medium mt-1">Resolution Sent</span>
        </div>
      </div>

      {/* High Priority Dispatch Banner if any critical issue */}
      {assignedIssues.some((i) => i.priority === 'Critical' && i.status !== 'Resolved') && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-rose-900">
          <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold">Critical Emergency Dispatch</h4>
            <p className="text-xs text-rose-700 mt-0.5">
              High-priority pothole / drainage task requiring immediate crew response on SV Road.
            </p>
          </div>
        </div>
      )}

      {/* Assigned Tasks List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 md:p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">My Field Assignments</h2>
          <Link
            to="/worker/assigned"
            className="text-xs font-semibold text-blue-700 hover:text-blue-800 flex items-center gap-1"
          >
            View All ({assignedIssues.length}) <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="space-y-3">
          {assignedIssues.map((issue) => (
            <div
              key={issue.id}
              className="p-4 rounded-xl border border-slate-200 hover:border-blue-300 transition-colors bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="flex items-start gap-3">
                {issue.report.images && issue.report.images.length > 0 ? (
                  <img
                    src={getImageUrl(issue.report.images[0].url)}
                    onError={handleImageError}
                    alt={issue.report.title}
                    className="w-16 h-16 rounded-lg object-cover shrink-0 border border-slate-200"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-slate-200 flex items-center justify-center text-slate-400 text-xs shrink-0">
                    No image
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono font-semibold text-slate-500">
                      {issue.trackingNumber}
                    </span>
                    <IssueStatusBadge status={issue.status} />
                    <PriorityBadge priority={issue.priority} />
                    <SeverityBadge severity={issue.severity} />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 mt-1">{issue.report.title}</h3>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{issue.report.address}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                <Link
                  to={`/worker/issues/${issue.id}`}
                  className="px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-xs transition-colors"
                >
                  View Details & Repair <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
