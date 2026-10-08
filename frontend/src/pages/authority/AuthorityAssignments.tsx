import React, { useEffect, useState } from 'react';
import { issueService } from '../../services/issueService';
import { Issue, Assignment } from '../../types';
import { IssueStatusBadge } from '../../components/common/IssueStatusBadge';
import { DemoBadge } from '../../components/common/DemoBadge';
import { AssignmentModal } from '../../components/authority/AssignmentModal';
import { LoadingState } from '../../components/common/LoadingState';
import { Users } from 'lucide-react';

export const AuthorityAssignments: React.FC = () => {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);

  useEffect(() => {
    issueService.getIssues().then((data) => {
      setIssues(data);
      setLoading(false);
    });
  }, []);

  if (loading) return <LoadingState message="Loading department dispatches..." />;

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
            <h1 className="text-xl font-bold text-slate-900">Department Assignments & Squad Dispatches</h1>
            <DemoBadge label="Dispatch Roster" />
          </div>
          <p className="text-xs text-slate-500">
            Dispatch municipal work orders to field teams with target SLA completion deadlines.
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
              <tr>
                <th className="p-3">Ticket ID</th>
                <th className="p-3">Issue Title</th>
                <th className="p-3">Assigned Department</th>
                <th className="p-3">Field Squad Team</th>
                <th className="p-3">Target SLA Date</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Dispatch Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {issues.map((i) => (
                <tr key={i.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-3 font-mono font-bold text-slate-900">{i.trackingNumber}</td>
                  <td className="p-3">
                    <p className="font-bold text-slate-900">{i.report.title}</p>
                    <span className="text-[11px] text-slate-400">{i.report.address}</span>
                  </td>
                  <td className="p-3 text-slate-800">
                    {i.assignment ? i.assignment.departmentName : 'Unassigned'}
                  </td>
                  <td className="p-3 font-medium text-blue-700">
                    {i.assignment ? i.assignment.teamName : 'Unassigned'}
                  </td>
                  <td className="p-3 text-slate-500 font-mono">
                    {i.assignment ? i.assignment.targetResolutionDate : '—'}
                  </td>
                  <td className="p-3">
                    <IssueStatusBadge status={i.status} size="sm" />
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => setSelectedIssue(i)}
                      className="px-3 py-1 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-lg transition-colors inline-flex items-center gap-1"
                    >
                      <Users className="w-3.5 h-3.5" /> {i.assignment ? 'Reassign' : 'Dispatch Squad'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AssignmentModal
        issue={selectedIssue}
        isOpen={!!selectedIssue}
        onClose={() => setSelectedIssue(null)}
        onAssign={handleAssign}
      />
    </div>
  );
};
