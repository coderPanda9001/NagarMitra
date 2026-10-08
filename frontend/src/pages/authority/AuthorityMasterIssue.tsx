import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { issueService } from '../../services/issueService';
import { Issue, Assignment } from '../../types';
import { IssueStatusBadge } from '../../components/common/IssueStatusBadge';
import { SeverityBadge } from '../../components/common/SeverityBadge';
import { PriorityBadge } from '../../components/common/PriorityBadge';
import { DemoBadge } from '../../components/common/DemoBadge';
import { IssueTimeline } from '../../components/citizen/IssueTimeline';
import { AssignmentModal } from '../../components/authority/AssignmentModal';
import { WhyHighDrawer } from '../../components/authority/WhyHighDrawer';
import { LoadingState } from '../../components/common/LoadingState';
import { ErrorState } from '../../components/common/ErrorState';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Sparkles,
  Split,
  Users,
  Layers,
  GitMerge,
  Unlink,
  AlertTriangle,
  Shield,
  CheckCircle2,
} from 'lucide-react';

export const AuthorityMasterIssue: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [issue, setIssue] = useState<Issue | null>(null);
  const [children, setChildren] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [whyHighOpen, setWhyHighOpen] = useState(false);
  const [splitMessage, setSplitMessage] = useState<string | null>(null);
  const [confirmSplitAll, setConfirmSplitAll] = useState(false);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [confirmSplitOne, setConfirmSplitOne] = useState(false);
  const [mergeSuccess, setMergeSuccess] = useState<string | null>(null);

  const loadIssue = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const found = await issueService.getIssueById(id);
      setIssue(found || null);
      if (found && found.linkedChildIds && found.linkedChildIds.length > 0) {
        const childPromises = found.linkedChildIds.map((cid) => issueService.getIssueById(cid).catch(() => undefined));
        const childResults = await Promise.all(childPromises);
        setChildren(childResults.filter((c): c is Issue => !!c));
      } else {
        setChildren([]);
      }
    } catch (e: any) {
      setError(e?.message || 'Failed to load master issue');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadIssue();
  }, [loadIssue]);

  if (loading) return <LoadingState message="Fetching master issue record..." />;
  if (error) return <ErrorState message={error} />;
  if (!issue) return <ErrorState message="Master issue record not found." />;

  const reportCount = issue.reportCount || issue.supportingCount || 1;

  const handleAssign = async (assignment: Assignment) => {
    const updated = await issueService.assignIssue(assignment);
    setIssue(updated);
    await loadIssue();
  };

  const handleSplitAll = async () => {
    let anyOk = false;
    for (const c of children) {
      try {
        await issueService.splitIssue(c.id);
        anyOk = true;
      } catch (e: any) {
        console.warn('split failed for', c.id, e?.message);
      }
    }
    setConfirmSplitAll(false);
    setSplitMessage(anyOk ? 'Split interface executed: Linked duplicate tickets unmerged into standalone queues.' : 'No linked tickets to split.');
    setTimeout(() => setSplitMessage(null), 5000);
    await loadIssue();
  };

  const handleSplitOne = async () => {
    if (!selectedChildId) return;
    try {
      await issueService.splitIssue(selectedChildId);
      setSplitMessage(`Ticket ${selectedChildId} unlinked from master.`);
    } catch (e: any) {
      setSplitMessage(e?.message || 'Failed to split.');
    }
    setConfirmSplitOne(false);
    setSelectedChildId(null);
    setTimeout(() => setSplitMessage(null), 5000);
    await loadIssue();
  };

  const handlePromoteChildToMaster = async (childId: string) => {
    if (!issue) return;
    try {
      await issueService.mergeIssue(issue.id, childId);
      setMergeSuccess(`Master issue #${issue.trackingNumber} merged into ${childId}. Navigating...`);
      setTimeout(() => navigate(`/authority/master/${childId}`, { replace: true }), 1500);
    } catch (e: any) {
      setSplitMessage(e?.message || 'Failed to re-master issue.');
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <Link
          to="/authority/issues"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" /> Back to All Issues Index
        </Link>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setWhyHighOpen(true)}
            className="px-3 py-1.5 bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold rounded-lg hover:bg-amber-100 flex items-center gap-1.5 transition-colors"
          >
            <AlertTriangle className="w-4 h-4" /> Why {issue.priority}?
          </button>
          <button
            onClick={() => setAssignModalOpen(true)}
            className="px-3.5 py-1.5 bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5"
          >
            <Users className="w-4 h-4" /> Dispatch / Assign Team
          </button>
          <button
            onClick={() => setConfirmSplitAll(true)}
            disabled={children.length === 0}
            className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg border border-slate-300 transition-colors flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Split className="w-4 h-4" /> Split Linked Reports
          </button>
        </div>
      </div>

      {splitMessage && (
        <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 text-xs rounded-xl font-semibold flex items-center gap-2">
          <Split className="w-4 h-4 text-amber-700" />
          {splitMessage}
        </div>
      )}
      {mergeSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs rounded-xl font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-700" />
          {mergeSuccess}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded">
              {issue.trackingNumber}
            </span>
            <IssueStatusBadge status={issue.status} />
            <DemoBadge label="Master Record" />
            <span className="text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded-full">
              <Shield className="w-3 h-3 inline mr-1" />
              {reportCount} citizen reports (Supporting count: {issue.supportingCount})
            </span>
          </div>
          <div className="flex items-center gap-2">
            <SeverityBadge severity={issue.severity} size="sm" showIcon />
            <PriorityBadge priority={issue.priority} size="sm" />
          </div>
        </div>

        <div>
          <h1 className="text-xl font-bold text-slate-900 leading-snug">{issue.report.title}</h1>
          <p className="mt-2 text-xs text-slate-600 leading-relaxed">{issue.report.description}</p>
        </div>

        <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100 gap-2">
          <div className="flex items-center gap-1">
            <MapPin className="w-4 h-4 text-blue-700 shrink-0" />
            <span className="font-semibold text-slate-800">{issue.report.address}</span> ({issue.report.ward})
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span>Created on {new Date(issue.createdAt).toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div className="bg-indigo-50/60 border border-indigo-200 rounded-2xl p-5 space-y-4 shadow-xs">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-950 flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-700" />
            Visually Connected Duplicate Reports ({children.length} Linked)
          </h3>
          <DemoBadge label="Aggregated Complaints" />
        </div>

        {children.length === 0 ? (
          <p className="text-xs text-slate-500 italic bg-white/70 p-3 rounded-lg border border-indigo-100">
            No linked duplicate child reports under this master yet. Review flagged duplicates on the Geospatial Duplicate Triage page.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {children.map((child) => (
              <div key={child.id} className="bg-white p-4 rounded-xl border border-indigo-200 space-y-2 text-xs relative">
                <div className="flex justify-between items-start flex-wrap gap-1">
                  <div>
                    <div className="font-mono font-bold text-slate-400 text-[10px]">{child.trackingNumber}</div>
                    <div className="text-[10px] text-indigo-700 font-semibold">
                      by {child.report.citizenName || 'Citizen'}
                    </div>
                  </div>
                  <IssueStatusBadge status={child.status} />
                </div>
                <p className="font-bold text-slate-900">{child.report.title}</p>
                <p className="text-slate-500 text-[11px]">
                  {child.report.address} · Reported {new Date(child.report.reportedAt).toLocaleString()}
                </p>
                <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                  <Link
                    to={`/authority/master/${child.id}`}
                    className="text-[11px] font-semibold text-blue-700 hover:underline flex items-center gap-1"
                  >
                    View child
                  </Link>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handlePromoteChildToMaster(child.id)}
                      title="Promote this child to master, merging current master into it"
                      className="text-[11px] font-semibold text-indigo-700 hover:text-indigo-900 flex items-center gap-1 bg-indigo-50 border border-indigo-200 px-2 py-1 rounded-md hover:bg-indigo-100"
                    >
                      <GitMerge className="w-3.5 h-3.5" /> Promote
                    </button>
                    <button
                      onClick={() => {
                        setSelectedChildId(child.id);
                        setConfirmSplitOne(true);
                      }}
                      title="Unlink this child report"
                      className="text-[11px] font-semibold text-amber-700 hover:text-amber-900 flex items-center gap-1 bg-amber-50 border border-amber-200 px-2 py-1 rounded-md hover:bg-amber-100"
                    >
                      <Unlink className="w-3.5 h-3.5" /> Split
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {issue.aiAnalysis && (
          <div className="bg-sky-50 border border-sky-200 rounded-xl p-5 space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sky-900 text-xs flex items-center gap-1">
                <Sparkles className="w-4 h-4 text-sky-600" /> AI Classification
              </span>
              <DemoBadge label={issue.aiAnalysis.isDemo ? 'Demo AI' : 'Live AI'} />
            </div>
            <div className="text-xs space-y-1.5">
              <p className="font-semibold text-sky-950">Category: {issue.aiAnalysis.detectedCategory}</p>
              <p className="text-sky-800">Confidence: {Math.round(issue.aiAnalysis.confidenceScore * 100)}%</p>
              {issue.aiAnalysis.potentialDuplicateIds && issue.aiAnalysis.potentialDuplicateIds.length > 0 && (
                <p className="text-sky-900 font-semibold">
                  Potential duplicates: {issue.aiAnalysis.potentialDuplicateIds.length} candidates
                </p>
              )}
              <p className="text-sky-700 italic bg-white/80 p-2.5 rounded border border-sky-100">
                "{issue.aiAnalysis.aiReasoning}"
              </p>
            </div>
          </div>
        )}

        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-900 text-xs flex items-center gap-1">
              <Users className="w-4 h-4 text-blue-700" /> Active Dispatch Assignment
            </span>
            <button
              onClick={() => setAssignModalOpen(true)}
              className="text-xs text-blue-700 font-bold hover:underline"
            >
              Reassign
            </button>
          </div>

          {(issue.assignedDepartmentId || issue.assignedTeamId || issue.assignment) ? (
            <div className="text-xs space-y-1.5">
              <p className="font-bold text-slate-900">{issue.assignment?.teamName || issue.assignedTeamId || 'TBD'}</p>
              <p className="text-slate-600">Department: {issue.assignment?.departmentName || issue.assignedDepartmentId || 'Unassigned'}</p>
              {issue.assignment?.targetResolutionDate && (
                <p className="text-slate-500">Target SLA: {issue.assignment.targetResolutionDate}</p>
              )}
              {issue.assignment?.notes && (
                <p className="text-slate-700 bg-slate-50 p-2 rounded border border-slate-100 italic">
                  "{issue.assignment.notes}"
                </p>
              )}
            </div>
          ) : (
            <div className="text-xs text-slate-400 p-4 bg-slate-50 rounded-lg text-center">
              No field team assigned yet. Click dispatch button above.
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900">Audit History Timeline</h3>
        <IssueTimeline currentStatus={issue.status} history={issue.statusHistory} />
      </div>

      <AssignmentModal
        issue={issue}
        isOpen={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        onAssign={handleAssign}
      />
      <WhyHighDrawer issue={issue} isOpen={whyHighOpen} onClose={() => setWhyHighOpen(false)} />

      <ConfirmDialog
        isOpen={confirmSplitAll}
        title="Unlink ALL linked duplicates?"
        message={`This will split ${children.length} merged child reports back into standalone tickets. All original reports preserved.`}
        confirmLabel="Split All Child Reports"
        variant="info"
        onConfirm={handleSplitAll}
        onCancel={() => setConfirmSplitAll(false)}
      />
      <ConfirmDialog
        isOpen={confirmSplitOne}
        title="Unlink selected child ticket?"
        message={`Child ${selectedChildId || ''} will become a standalone report. Its supporting count contribution is subtracted from master.`}
        confirmLabel="Unlink This Child"
        variant="info"
        onConfirm={handleSplitOne}
        onCancel={() => {
          setConfirmSplitOne(false);
          setSelectedChildId(null);
        }}
      />
    </div>
  );
};
