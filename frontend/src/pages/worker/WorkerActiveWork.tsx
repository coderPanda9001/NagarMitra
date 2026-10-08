import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { issueService } from '../../services/issueService';
import { Issue } from '../../types';
import { IssueStatusBadge } from '../../components/common/IssueStatusBadge';
import { PriorityBadge } from '../../components/common/PriorityBadge';
import { DemoBadge } from '../../components/common/DemoBadge';
import { LoadingState } from '../../components/common/LoadingState';
import { Wrench, MapPin, ArrowRight, Camera } from 'lucide-react';

export const WorkerActiveWork: React.FC = () => {
  const [activeIssues, setActiveIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    issueService.getIssues().then((data) => {
      const active = data.filter((i) => i.status === 'In Progress');
      setActiveIssues(active);
      setLoading(false);
    });
  }, []);

  if (loading) return <LoadingState message="Loading active work in progress..." />;

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-5 pb-20 md:pb-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-bold text-slate-900">Active Work in Progress</h1>
            <DemoBadge />
          </div>
          <p className="text-xs md:text-sm text-slate-500">
            Jobs currently being repaired on site
          </p>
        </div>
        <span className="px-3 py-1 bg-amber-100 text-amber-900 text-xs font-semibold rounded-full flex items-center gap-1">
          <Wrench className="w-3.5 h-3.5" /> {activeIssues.length} Active
        </span>
      </div>

      <div className="space-y-4">
        {activeIssues.length === 0 ? (
          <div className="bg-white p-8 text-center rounded-xl border border-slate-200 text-slate-500 text-sm">
            No active jobs in progress. Select a task from Assigned list to start work.
          </div>
        ) : (
          activeIssues.map((issue) => (
            <div
              key={issue.id}
              className="bg-amber-50/40 border border-amber-200 rounded-2xl p-4 md:p-5 shadow-xs space-y-4"
            >
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded">
                    {issue.trackingNumber}
                  </span>
                  <IssueStatusBadge status={issue.status} />
                  <PriorityBadge priority={issue.priority} />
                </div>
                <span className="text-xs text-amber-800 font-medium">Started 2 hrs ago</span>
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900">{issue.report.title}</h3>
                <p className="text-xs text-slate-600 mt-1">{issue.report.description}</p>
              </div>

              <div className="bg-white p-3 rounded-xl border border-slate-200 text-xs space-y-1">
                <div className="flex items-center gap-1 text-slate-700 font-semibold">
                  <MapPin className="w-3.5 h-3.5 text-rose-500" /> Location: {issue.report.address}
                </div>
                <div className="text-slate-500">
                  Target SLA Completion: <strong className="text-slate-800">Within 12 hours</strong>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Camera className="w-4 h-4 text-slate-400" /> Before/After photos upload ready
                </div>
                <Link
                  to={`/worker/issues/${issue.id}`}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs flex items-center gap-1 shadow transition-colors"
                >
                  Continue Repair & Submit Evidence <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
