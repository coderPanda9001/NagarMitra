import React, { useEffect, useMemo, useState } from 'react';
import { Issue, Assignment } from '../../types';
import { DemoBadge } from '../common/DemoBadge';
import { issueService, DepartmentDTO, TeamDTO } from '../../services/issueService';
import { X, Users, Sparkles, Check, Loader2 } from 'lucide-react';

interface AssignmentModalProps {
  issue: Issue | null;
  isOpen: boolean;
  onClose: () => void;
  onAssign: (assignment: Assignment) => void;
}

export const AssignmentModal: React.FC<AssignmentModalProps> = ({
  issue,
  isOpen,
  onClose,
  onAssign,
}) => {
  const [departments, setDepartments] = useState<DepartmentDTO[]>([]);
  const [teams, setTeams] = useState<TeamDTO[]>([]);
  const [loading, setLoading] = useState(false);

  const [departmentId, setDepartmentId] = useState<string>('');
  const [teamId, setTeamId] = useState<string>('');
  const [targetDate, setTargetDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().slice(0, 10);
  });
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    setLoading(true);
    Promise.all([issueService.getDepartments(), issueService.getTeams()])
      .then(([depts, tms]) => {
        if (cancelled) return;
        setDepartments(depts);
        setTeams(tms);

        if (issue) {
          const initDept =
            issue.assignedDepartmentId ||
            issue.assignment?.departmentId ||
            depts.find((d) => d.name.toLowerCase().includes(issue.report.category.toLowerCase()) ||
                              issue.report.category.toLowerCase().includes(d.name.toLowerCase()))?.id ||
            depts[0]?.id ||
            '';
          setDepartmentId(initDept);
        } else {
          setDepartmentId(depts[0]?.id || '');
        }
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [isOpen, issue?.id]);

  const teamsForDept = useMemo(() => {
    if (!departmentId) return teams;
    const deptName = departments.find((d) => d.id === departmentId)?.name;
    return teams.filter(
      (t) =>
        t.department_id === departmentId ||
        (deptName && (t.name.toLowerCase().includes(deptName.toLowerCase()) || deptName.toLowerCase().includes((t.name || '').toLowerCase())))
    );
  }, [teams, departmentId, departments]);

  const selectedDeptName = departments.find((d) => d.id === departmentId)?.name || departmentId;
  const selectedTeam = teams.find((t) => t.id === teamId) || teamsForDept[0];
  const selectedTeamName = selectedTeam?.name || 'Primary Unit';

  useEffect(() => {
    if (!issue) return;
    if (teamsForDept.length === 0) return;
    if (teamId && teamsForDept.some((t) => t.id === teamId)) return;

    let recommended = teamsForDept.find((t) => (t.ward || '') === issue.report.ward);
    if (!recommended) {
      recommended = teamsForDept.find((t) =>
        (issue.report.ward || '').toLowerCase().includes((t.ward || '').toLowerCase().replace(/ward /i, ''))
      );
    }
    if (!recommended) recommended = teamsForDept[0];
    if (recommended) setTeamId(recommended.id);
  }, [teamsForDept, issue?.report.ward]);

  if (!isOpen || !issue) return null;

  const handleConfirmAssignment = () => {
    const newAssignment: Assignment = {
      id: `asg-${Date.now()}`,
      issueId: issue.id,
      assignedBy: 'Authority User',
      departmentId,
      departmentName: selectedDeptName,
      teamId,
      teamName: selectedTeamName,
      workerIds: [],
      assignedAt: new Date().toISOString(),
      targetResolutionDate: targetDate,
      notes: notes || 'Standard priority dispatch.',
    };
    onAssign(newAssignment);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-xl max-w-xl w-full border border-slate-200 p-6 relative space-y-5 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Users className="w-5 h-5 text-blue-700" />
          <h2 className="text-base font-bold text-slate-900">Dispatch Team Assignment</h2>
          <DemoBadge label={loading ? 'Loading lists…' : 'API Driven'} />
          {loading && <Loader2 className="w-4 h-4 animate-spin text-slate-500" />}
        </div>

        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs space-y-1">
          <span className="font-mono text-slate-400 font-bold">{issue.trackingNumber}</span>
          <h4 className="font-bold text-slate-900">{issue.report.title}</h4>
          <p className="text-slate-600">
            {issue.report.address} ({issue.report.ward}) · Category: {issue.report.category}
          </p>
        </div>

        <div className="bg-sky-50 border border-sky-200 rounded-xl p-4 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-sky-950 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-sky-600" /> AI Recommended Assignment
            </span>
            <span className="text-[10px] font-bold text-sky-800 bg-sky-100 px-2 py-0.5 rounded border border-sky-300">
              Recommendation Only
            </span>
          </div>

          <p className="text-sky-900 font-semibold">
            {selectedTeamName} ({selectedDeptName || 'Matching department'})
          </p>

          <ul className="space-y-1 text-[11px] text-sky-800 pl-4 list-disc">
            <li>Matches issue category ({issue.report.category})</li>
            <li>
              Ward alignment:{' '}
              {selectedTeam?.ward
                ? `${selectedTeam.ward} vs report ${issue.report.ward}`
                : 'Unrestricted coverage zone'}
            </li>
            <li>Dispatch capacity: Default pool available</li>
            <li>SLA target: {new Date(targetDate).toLocaleDateString()}</li>
          </ul>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Select Department</label>
            <select
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded-lg bg-white"
            >
              {departments.length === 0 && <option value="">(loading)</option>}
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Select Field Squad</label>
            <select
              value={teamId}
              onChange={(e) => setTeamId(e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded-lg bg-white"
            >
              {teamsForDept.length === 0 && <option value="">No squads for selected department</option>}
              {teamsForDept.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}{t.ward ? ` · ${t.ward}` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Target SLA Resolution Deadline
          </label>
          <input
            type="date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
            className="w-full p-2.5 text-xs border border-slate-300 rounded-lg"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Dispatch Instructions & Field Notes
          </label>
          <textarea
            rows={2}
            placeholder="e.g. Inspect asphalt thickness, use rapid-curing bitumen mix..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full p-2.5 text-xs border border-slate-300 rounded-lg"
          />
        </div>

        <div className="pt-2 flex flex-col sm:flex-row justify-end gap-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirmAssignment}
            className="px-5 py-2 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-lg shadow-sm flex items-center justify-center gap-1.5"
          >
            <Check className="w-4 h-4" /> Confirm Dispatch Assignment
          </button>
        </div>
      </div>
    </div>
  );
};
