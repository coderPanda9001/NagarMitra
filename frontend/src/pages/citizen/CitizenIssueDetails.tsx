import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { issueService } from '../../services/issueService';
import { useAuth } from '../../context/AuthContext';
import { Issue, IssueImage } from '../../types';
import { IssueStatusBadge } from '../../components/common/IssueStatusBadge';
import { SeverityBadge } from '../../components/common/SeverityBadge';
import { PriorityBadge } from '../../components/common/PriorityBadge';
import { IssueTimeline } from '../../components/citizen/IssueTimeline';
import { DemoBadge } from '../../components/common/DemoBadge';
import { LoadingState } from '../../components/common/LoadingState';
import { ErrorState } from '../../components/common/ErrorState';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Sparkles,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ShieldCheck,
  Check,
  ImageOff,
} from 'lucide-react';
import { getImageUrl, handleImageError } from '../../utils/imageUtils';

export const CitizenIssueDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { currentUser } = useAuth();
  const [issue, setIssue] = useState<Issue | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    type: 'Fixed' | 'Partially Fixed' | 'Still Not Fixed';
  }>({ isOpen: false, type: 'Fixed' });
  const [feedbackNotes, setFeedbackNotes] = useState('');
  const [verifiedSuccess, setVerifiedSuccess] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      issueService.getIssueById(id).then((found) => {
        setIssue(found || null);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, [id]);

  const beforeImages = useMemo<IssueImage[]>(() => {
    if (!issue) return [];
    const all = issue.report.images || [];
    const citizenImgs = all.filter((img) => img.uploadedByRole === 'Citizen');
    if (citizenImgs.length > 0) return citizenImgs;
    const beforeByCaption = all.filter((img) => {
      const cap = (img.caption || '').toLowerCase();
      return cap.includes('before') || cap.includes('report') || cap.includes('inspect');
    });
    if (beforeByCaption.length > 0) return beforeByCaption;
    return all.slice(0, 1);
  }, [issue]);

  const afterImages = useMemo<IssueImage[]>(() => {
    if (!issue) return [];
    const all = issue.report.images || [];
    const workerImgs = all.filter((img) => (img.uploadedByRole || '').toLowerCase() === 'worker');
    const afterByCaption = workerImgs.filter((img) => {
      const cap = (img.caption || '').toLowerCase();
      return cap.includes('after') || cap.includes('complete') || cap.includes('resolution');
    });
    if (afterByCaption.length > 0) return afterByCaption;
    const beforeIds = new Set(beforeImages.map(b => b.id));
    const nonBeforeWorkerImgs = workerImgs.filter(w => !beforeIds.has(w.id));
    if (nonBeforeWorkerImgs.length > 0) return nonBeforeWorkerImgs;
    if (issue.resolution?.evidence?.afterImages) {
      return issue.resolution.evidence.afterImages;
    }
    return [];
  }, [issue, beforeImages]);

  const resolutionWorkerName = useMemo<string>(() => {
    if (issue?.resolution?.evidence?.workerName) return issue.resolution.evidence.workerName;
    if (!issue) return 'Assigned Field Worker';
    const workerEvents = issue.statusHistory.filter(
      (e) => e.userRole === 'Worker' && (e.status === 'In Progress' || e.status === 'Resolution Submitted' || e.status === 'Awaiting Verification')
    );
    if (workerEvents.length > 0) return workerEvents[workerEvents.length - 1].updatedBy;
    return 'Assigned Field Worker';
  }, [issue]);

  const resolutionCompletionNotes = useMemo<string>(() => {
    if (issue?.resolution?.evidence?.completionNotes) return issue.resolution.evidence.completionNotes;
    if (!issue) return '';
    const noteEvents = issue.statusHistory.filter(
      (e) => e.userRole === 'Worker' && e.comment && e.comment.toLowerCase().includes('complete')
    );
    if (noteEvents.length > 0) return noteEvents[noteEvents.length - 1].comment!;
    const lastWorker = issue.statusHistory.filter((e) => e.userRole === 'Worker' && e.comment);
    if (lastWorker.length > 0) return lastWorker[lastWorker.length - 1].comment!;
    return 'Field work completed successfully. Awaiting citizen verification.';
  }, [issue]);

  const hasEvidence = beforeImages.length > 0 || afterImages.length > 0;
  const statusAllowsEvidence =
    issue &&
    ['Resolution Submitted', 'Awaiting Verification', 'Resolved', 'Verified', 'Reopened'].includes(issue.status);

  if (loading) return <LoadingState message="Loading issue details..." />;
  if (!issue) return <ErrorState message="Complaint record not found or invalid tracking ID." />;

  const handleConfirmVerification = async () => {
    if (!issue) return;
    const satisfied = confirmState.type === 'Fixed';
    const rating = satisfied ? 5 : confirmState.type === 'Partially Fixed' ? 3 : 2;
    setVerificationError(null);

    try {
      const updated = await issueService.verifyResolution(issue.id, {
        id: `ver-${Date.now()}`,
        issueId: issue.id,
        citizenId: currentUser.id,
        satisfied,
        rating,
        feedback: feedbackNotes || `Citizen marked repair as ${confirmState.type}`,
        verifiedAt: new Date().toISOString(),
      });

      setIssue(updated);
      setConfirmState({ ...confirmState, isOpen: false });
      setVerifiedSuccess(true);
      setFeedbackNotes('');
    } catch (err) {
      setVerificationError(err instanceof Error ? err.message : 'Failed to submit verification. Please try again.');
      setConfirmState({ ...confirmState, isOpen: false });
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Link
        to="/citizen/issues"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to My Complaints
      </Link>

      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded">
              {issue.trackingNumber}
            </span>
            <IssueStatusBadge status={issue.status} />
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
            <span>Reported on {new Date(issue.report.reportedAt).toLocaleString()}</span>
          </div>
        </div>

        {(issue.supportingCount > 1 || (issue.reportCount ?? 0) > 1) && (
          <div className="bg-violet-50 border border-violet-200 rounded-lg p-3 text-xs text-violet-900 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-violet-600" />
            <span>
              <strong>{issue.reportCount ?? issue.supportingCount} reports</strong> linked to this master issue
              (merged duplicates counted as group).
            </span>
          </div>
        )}
      </div>

      {issue.aiAnalysis && (
        <div className="bg-sky-50 border border-sky-200 rounded-xl p-5 space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sky-900 font-bold text-xs">
              <Sparkles className="w-4 h-4 text-sky-600" />
              <span>AI Automated Triage & Intelligence</span>
            </div>
            <DemoBadge label="AI-assisted (demo)" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="bg-white p-3 rounded-lg border border-sky-100">
              <span className="text-[10px] text-slate-400 font-semibold uppercase">Detected Category</span>
              <p className="font-bold text-sky-900 mt-0.5">{issue.aiAnalysis.detectedCategory}</p>
            </div>
            <div className="bg-white p-3 rounded-lg border border-sky-100">
              <span className="text-[10px] text-slate-400 font-semibold uppercase">Severity Score</span>
              <p className="font-bold text-sky-900 mt-0.5">{issue.aiAnalysis.suggestedSeverity} Risk</p>
            </div>
            <div className="bg-white p-3 rounded-lg border border-sky-100">
              <span className="text-[10px] text-slate-400 font-semibold uppercase">AI Confidence</span>
              <p className="font-bold text-sky-900 mt-0.5">{Math.round(issue.aiAnalysis.confidenceScore * 100)}% Match</p>
            </div>
          </div>

          <p className="text-xs text-sky-800 bg-white/70 p-2.5 rounded border border-sky-100 italic">
            &quot;{issue.aiAnalysis.aiReasoning}&quot;
          </p>
        </div>
      )}

      {(issue.status === 'Resolution Submitted' || issue.status === 'Awaiting Verification') && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 space-y-4 shadow-sm">
          <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
            <ShieldCheck className="w-5 h-5 text-emerald-700" />
            <h2>Citizen Quality Verification Required</h2>
          </div>
          <p className="text-xs text-emerald-800 leading-relaxed">
            The assigned field department has uploaded completion proof and marked this repair as finished. Please
            inspect the site and confirm if the issue has been resolved to your satisfaction.
          </p>

          {verificationError && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-lg p-3 text-xs font-semibold flex items-start gap-2">
              <XCircle className="w-4 h-4 shrink-0 mt-0.5" />
              {verificationError}
            </div>
          )}

          <div className="space-y-2">
            <label className="block text-xs font-semibold text-emerald-900">
              Optional Verification Comments / Feedback
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Work completed neatly, road asphalt feels smooth..."
              value={feedbackNotes}
              onChange={(e) => setFeedbackNotes(e.target.value)}
              className="w-full p-2 text-xs border border-emerald-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
            />
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              onClick={() => setConfirmState({ isOpen: true, type: 'Fixed' })}
              className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-lg shadow-xs flex items-center gap-1.5 transition-colors"
            >
              <Check className="w-4 h-4" /> Confirm Fixed & Close Ticket
            </button>
            <button
              onClick={() => setConfirmState({ isOpen: true, type: 'Partially Fixed' })}
              className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg shadow-xs flex items-center gap-1.5 transition-colors"
            >
              <AlertTriangle className="w-4 h-4" /> Partially Fixed
            </button>
            <button
              onClick={() => setConfirmState({ isOpen: true, type: 'Still Not Fixed' })}
              className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-lg shadow-xs flex items-center gap-1.5 transition-colors"
            >
              <XCircle className="w-4 h-4" /> Still Not Fixed (Reopen)
            </button>
          </div>
        </div>
      )}

      {verifiedSuccess && (
        <div className="p-4 bg-emerald-100 border border-emerald-300 text-emerald-900 rounded-xl text-xs font-semibold flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-emerald-700" />
          Thank you! Your verification feedback has been logged in the official municipal audit trail.
        </div>
      )}

      {statusAllowsEvidence && hasEvidence && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600" /> Repair Resolution Evidence
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <span className="text-[11px] font-semibold text-slate-500 uppercase block">
                Original Reported Photo (Before)
              </span>
              {beforeImages[0] ? (
                <img
                  src={getImageUrl(beforeImages[0].url)}
                  onError={handleImageError}
                  alt="Before repair"
                  className="w-full h-48 object-cover rounded-lg border border-slate-200"
                />
              ) : (
                <div className="w-full h-48 bg-slate-100 rounded-lg flex items-center justify-center text-xs text-slate-400 gap-2">
                  <ImageOff className="w-5 h-5" /> No Before Photo
                </div>
              )}
              {beforeImages.length > 1 && (
                <p className="text-[10px] text-slate-400">+{beforeImages.length - 1} additional report photos</p>
              )}
            </div>

            <div className="space-y-2">
              <span className="text-[11px] font-semibold text-slate-500 uppercase block">
                Worker Evidence Photo (After)
              </span>
              {afterImages[0] ? (
                <img
                  src={getImageUrl(afterImages[0].url)}
                  onError={handleImageError}
                  alt="After repair"
                  className="w-full h-48 object-cover rounded-lg border border-slate-200"
                />
              ) : (
                <div className="w-full h-48 bg-slate-100 rounded-lg flex items-center justify-center text-xs text-slate-400 gap-2">
                  <ImageOff className="w-5 h-5" /> No After Photo Uploaded
                </div>
              )}
              {afterImages.length > 1 && (
                <p className="text-[10px] text-slate-400">+{afterImages.length - 1} additional worker photos</p>
              )}
            </div>
          </div>

          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs space-y-1">
            <p className="font-semibold text-slate-800">Completed by: {resolutionWorkerName}</p>
            <p className="text-slate-600">&quot;{resolutionCompletionNotes}&quot;</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-6 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900">Official Municipal Audit Timeline</h3>
        <IssueTimeline currentStatus={issue.status} history={issue.statusHistory} />
      </div>

      <ConfirmDialog
        isOpen={confirmState.isOpen}
        title={`Confirm Verification: ${confirmState.type}`}
        message={
          confirmState.type === 'Fixed'
            ? `Confirming "Fixed" will finalize this ticket as Verified in the municipal audit trail. Are you sure the repair is fully complete?`
            : confirmState.type === 'Still Not Fixed'
              ? `Marking "Still Not Fixed" will REOPEN this ticket and flag the field team to revisit. Continue?`
              : `Marking "Partially Fixed" will REOPEN this ticket with a note for the team to complete the remaining work. Continue?`
        }
        confirmLabel="Submit Verification"
        variant={confirmState.type === 'Fixed' ? 'info' : 'danger'}
        onConfirm={handleConfirmVerification}
        onCancel={() => setConfirmState({ ...confirmState, isOpen: false })}
      />
    </div>
  );
};
