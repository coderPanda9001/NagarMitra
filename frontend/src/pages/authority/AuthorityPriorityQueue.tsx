import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { issueService } from '../../services/issueService';
import { Issue, Assignment } from '../../types';
import { IssueStatusBadge } from '../../components/common/IssueStatusBadge';
import { SeverityBadge } from '../../components/common/SeverityBadge';
import { PriorityBadge } from '../../components/common/PriorityBadge';
import { DemoBadge } from '../../components/common/DemoBadge';
import { WhyHighDrawer } from '../../components/authority/WhyHighDrawer';
import { AssignmentModal } from '../../components/authority/AssignmentModal';
import { LoadingState } from '../../components/common/LoadingState';
import { HelpCircle, Users } from 'lucide-react';

export const AuthorityPriorityQueue: React.FC = () => {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIssueForWhyHigh, setSelectedIssueForWhyHigh] = useState<Issue | null>(null);
  const [selectedIssueForAssign, setSelectedIssueForAssign] = useState<Issue | null>(null);

  useEffect(() => {
    issueService.getIssues().then((data) => {
      // Priority queue filters for high/critical or unassigned
      setIssues(data);
      setLoading(false);
    });
  }, []);

  if (loading) return <LoadingState message="Calculating priority queue weights..." />;

  const handleAssign = async (assignment: Assignment) => {
    const updated = await issueService.assignIssue(assignment);
    setIssues((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl font-bold text-slate-900">Severity Priority Queue</h1>
            <DemoBadge label="Real-time SLA Queue" />
          </div>
          <p className="text-xs text-slate-500">
            Issues sorted automatically by life-safety hazard, traffic density, neighbor upvotes, and SLA age.
          </p>
        </div>
      </div>

      {/* Priority Queue Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
              <tr>
                <th className="p-3">Issue ID</th>
                <th className="p-3">Category</th>
                <th className="p-3">Severity / Priority</th>
                <th className="p-3">Location & Ward</th>
                <th className="p-3">Age</th>
                <th className="p-3">Department</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {issues.map((iss) => (
                <tr key={iss.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-3 font-mono font-bold text-slate-900">
                    <Link to={`/authority/master/${iss.id}`} className="hover:text-blue-700">
                      {iss.trackingNumber}
                    </Link>
                  </td>
                  <td className="p-3 font-medium text-slate-800">{iss.report.category}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-1.5">
                      <SeverityBadge severity={iss.severity} size="sm" />
                      <PriorityBadge priority={iss.priority} size="sm" />
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="max-w-xs">
                      <p className="font-semibold text-slate-900 truncate">{iss.report.address}</p>
                      <span className="text-[10px] text-slate-400">{iss.report.ward}</span>
                    </div>
                  </td>
                  <td className="p-3 font-mono text-slate-500">
                    {Math.floor((Date.now() - new Date(iss.createdAt).getTime()) / (1000 * 60 * 60))}h ago
                  </td>
                  <td className="p-3 text-slate-700">
                    {iss.assignment ? iss.assignment.departmentName : 'Unassigned'}
                  </td>
                  <td className="p-3">
                    <IssueStatusBadge status={iss.status} size="sm" />
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setSelectedIssueForWhyHigh(iss)}
                        className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-[11px] font-bold rounded-lg transition-colors flex items-center gap-1"
                      >
                        <HelpCircle className="w-3.5 h-3.5" /> Why High?
                      </button>

                      <button
                        onClick={() => setSelectedIssueForAssign(iss)}
                        className="px-2.5 py-1 bg-blue-700 hover:bg-blue-800 text-white text-[11px] font-bold rounded-lg transition-colors flex items-center gap-1"
                      >
                        <Users className="w-3.5 h-3.5" /> Assign
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Drawers & Modals */}
      <WhyHighDrawer
        issue={selectedIssueForWhyHigh}
        onClose={() => setSelectedIssueForWhyHigh(null)}
      />

      <AssignmentModal
        issue={selectedIssueForAssign}
        isOpen={!!selectedIssueForAssign}
        onClose={() => setSelectedIssueForAssign(null)}
        onAssign={handleAssign}
      />
    </div>
  );
};
