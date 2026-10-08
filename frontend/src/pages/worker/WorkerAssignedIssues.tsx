import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { issueService } from '../../services/issueService';
import { Issue } from '../../types';
import { IssueStatusBadge } from '../../components/common/IssueStatusBadge';
import { PriorityBadge } from '../../components/common/PriorityBadge';
import { DemoBadge } from '../../components/common/DemoBadge';
import { LoadingState } from '../../components/common/LoadingState';
import { MapPin, CheckSquare, Search } from 'lucide-react';

export const WorkerAssignedIssues: React.FC = () => {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    issueService.getIssues().then((data) => {
      // Worker's assigned list
      const assigned = data.filter(
        (i) => i.status === 'Assigned' || i.status === 'Work Scheduled' || i.status === 'In Progress'
      );
      setIssues(assigned);
      setLoading(false);
    });
  }, []);

  if (loading) return <LoadingState message="Loading assigned tasks..." />;

  const filtered = issues.filter(
    (i) =>
      i.report.title.toLowerCase().includes(search.toLowerCase()) ||
      i.report.address.toLowerCase().includes(search.toLowerCase()) ||
      i.trackingNumber.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-5 pb-20 md:pb-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-bold text-slate-900">Assigned Tasks</h1>
            <DemoBadge />
          </div>
          <p className="text-xs md:text-sm text-slate-500">
            Open repairs dispatched to Field Squad #1
          </p>
        </div>
        <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">
          {filtered.length} Jobs
        </span>
      </div>

      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
        <input
          type="text"
          placeholder="Search by ID, location, or issue name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
        />
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-white p-8 text-center rounded-xl border border-slate-200 text-slate-500 text-sm">
            No assigned tasks found matching criteria.
          </div>
        ) : (
          filtered.map((issue) => (
            <div
              key={issue.id}
              className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                    {issue.trackingNumber}
                  </span>
                  <IssueStatusBadge status={issue.status} />
                  <PriorityBadge priority={issue.priority} />
                </div>
                <span className="text-xs text-slate-400 font-medium">{issue.report.ward}</span>
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900">{issue.report.title}</h3>
                <p className="text-xs text-slate-600 line-clamp-2 mt-1">{issue.report.description}</p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
                <div className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>{issue.report.address}</span>
                </div>
                <Link
                  to={`/worker/issues/${issue.id}`}
                  className="px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white font-semibold rounded-lg flex items-center gap-1"
                >
                  <CheckSquare className="w-3.5 h-3.5" /> Start / Detail
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
