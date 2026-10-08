import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { issueService } from '../../services/issueService';
import { Issue } from '../../types';
import { IssueStatusBadge } from '../../components/common/IssueStatusBadge';
import { DemoBadge } from '../../components/common/DemoBadge';
import { LoadingState } from '../../components/common/LoadingState';
import { CheckCircle2, MapPin, Eye } from 'lucide-react';

export const WorkerCompleted: React.FC = () => {
  const [completedIssues, setCompletedIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    issueService.getIssues().then((data) => {
      const completed = data.filter(
        (i) => i.status === 'Resolution Submitted' || i.status === 'Resolved'
      );
      setCompletedIssues(completed);
      setLoading(false);
    });
  }, []);

  if (loading) return <LoadingState message="Loading completed repairs..." />;

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-5 pb-20 md:pb-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-bold text-slate-900">Completed Repairs</h1>
            <DemoBadge />
          </div>
          <p className="text-xs md:text-sm text-slate-500">
            Finished jobs with resolution evidence submitted
          </p>
        </div>
        <span className="px-3 py-1 bg-emerald-100 text-emerald-900 text-xs font-semibold rounded-full flex items-center gap-1">
          <CheckCircle2 className="w-3.5 h-3.5" /> {completedIssues.length} Resolved
        </span>
      </div>

      <div className="space-y-3">
        {completedIssues.length === 0 ? (
          <div className="bg-white p-8 text-center rounded-xl border border-slate-200 text-slate-500 text-sm">
            No completed repairs recorded yet.
          </div>
        ) : (
          completedIssues.map((issue) => (
            <div
              key={issue.id}
              className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-200">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono font-semibold text-slate-500">
                      {issue.trackingNumber}
                    </span>
                    <IssueStatusBadge status={issue.status} />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 mt-1">{issue.report.title}</h3>
                  <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{issue.report.address}</span>
                  </div>
                </div>
              </div>

              <Link
                to={`/worker/issues/${issue.id}`}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1 shrink-0 self-end sm:self-center"
              >
                <Eye className="w-3.5 h-3.5" /> View Job Record
              </Link>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
