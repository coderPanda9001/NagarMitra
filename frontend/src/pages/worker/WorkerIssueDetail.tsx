import React, { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { issueService } from '../../services/issueService';
import { Issue } from '../../types';
import { IssueStatusBadge } from '../../components/common/IssueStatusBadge';
import { PriorityBadge } from '../../components/common/PriorityBadge';
import { SeverityBadge } from '../../components/common/SeverityBadge';
import { DemoBadge } from '../../components/common/DemoBadge';
import { LoadingState } from '../../components/common/LoadingState';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import {
  ArrowLeft,
  MapPin,
  CheckCircle2,
  Play,
  Camera,
  FileText,
  Sparkles,
  Wrench,
  Plus,
  Upload,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { getImageUrl, handleImageError } from '../../utils/imageUtils';

export const WorkerIssueDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [issue, setIssue] = useState<Issue | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<null | 'start' | 'note' | 'photo-before' | 'photo-after' | 'complete'>(null);

  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteInput, setNoteInput] = useState('');
  const [showCompleteConfirm, setShowCompleteConfirm] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const beforeFileRef = useRef<HTMLInputElement | null>(null);
  const afterFileRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    issueService
      .getIssueById(id)
      .then((data) => {
        if (cancelled) return;
        if (!data) {
          setError('The requested repair job could not be located.');
        } else {
          setIssue(data);
        }
      })
      .catch((e: any) => !cancelled && setError(e?.message || 'Failed to load task'))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [id]);

  const flash = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  const getFullImageUrl = (url?: string | null): string => {
    return getImageUrl(url);
  };

  const workerPhotos = (issue?.report.images || []).filter(
    (i) => (i.uploadedByRole || '').toLowerCase() === 'worker'
  );
  const citizenPhotos = (issue?.report.images || []).filter(
    (i) => (i.uploadedByRole || '').toLowerCase() === 'citizen'
  );

  const workerNotes =
    issue?.statusHistory
      .filter((h) => (h.comment || '').startsWith('Field Note:'))
      .map((h) => h.comment!.replace(/^Field Note:\s*/, '')) || [];

  const explicitBeforeWorker = workerPhotos.find((p) => /before|inspect|site/i.test(p.caption || ''));
  const explicitAfterWorker = workerPhotos.find((p) => /after|complete|repair|done/i.test(p.caption || ''));

  let rawBeforeObj: any = null;
  if (explicitBeforeWorker) {
    rawBeforeObj = explicitBeforeWorker;
  } else if (workerPhotos.length > 0 && !explicitAfterWorker) {
    rawBeforeObj = workerPhotos[0];
  } else if (citizenPhotos.length > 0) {
    rawBeforeObj = citizenPhotos[0];
  } else {
    rawBeforeObj = null;
  }

  let rawAfterObj: any = null;
  if (explicitAfterWorker) {
    rawAfterObj = explicitAfterWorker;
  } else if (workerPhotos.length > 0) {
    const remainingWorkerPhoto = workerPhotos.find((p) => p.id !== rawBeforeObj?.id);
    if (remainingWorkerPhoto) {
      rawAfterObj = remainingWorkerPhoto;
    } else {
      rawAfterObj = null;
    }
  } else {
    rawAfterObj = null;
  }

  const beforePhoto = rawBeforeObj ? getImageUrl(rawBeforeObj) : null;
  const afterPhoto = rawAfterObj ? getImageUrl(rawAfterObj) : null;

  if (loading) return <LoadingState message="Loading worker task details..." />;

  if (!issue) {
    return (
      <div className="p-6 max-w-2xl mx-auto text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-900">Task Not Found</h2>
        <p className="text-sm text-slate-500">{error || 'The requested repair job could not be located.'}</p>
        <Link
          to="/worker"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-700 text-white rounded-lg text-sm font-semibold"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Task Center
        </Link>
      </div>
    );
  }

  const status = issue.status;
  const canStart =
    status !== 'In Progress' &&
    status !== 'Resolution Submitted' &&
    status !== 'Awaiting Verification' &&
    status !== 'Resolved' &&
    status !== 'Verified';
  const canComplete = status === 'In Progress' || status === 'Work Scheduled';

  const handleStartWork = async () => {
    if (!issue) return;
    setSubmitting('start');
    try {
      const updated = await issueService.startWork(issue.id);
      setIssue(updated);
      flash('Job status updated to "In Progress". Work timer started.');
    } catch (e: any) {
      alert(e?.message || 'Failed to start work');
    } finally {
      setSubmitting(null);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteInput.trim() || !issue) return;
    setSubmitting('note');
    try {
      const updated = await issueService.addWorkNote(issue.id, noteInput.trim());
      setIssue(updated);
      setNoteInput('');
      setShowNoteModal(false);
      flash('Work log note appended.');
    } catch (e: any) {
      alert(e?.message || 'Failed to add note');
    } finally {
      setSubmitting(null);
    }
  };

  const handleUploadPhoto = async (file: File | undefined, caption: string, kind: 'photo-before' | 'photo-after') => {
    if (!issue || !file) return;
    setSubmitting(kind);
    try {
      const dataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = () => resolve(URL.createObjectURL(file));
        reader.readAsDataURL(file);
      });

      const optimisticImg: any = {
        id: `img-opt-${Date.now()}`,
        url: dataUrl,
        fallbackUrl: dataUrl,
        caption: caption,
        uploadedAt: new Date().toISOString(),
        uploadedByRole: 'Worker',
      };

      setIssue((prev) => {
        if (!prev) return prev;
        const existingImages = prev.report.images || [];
        return {
          ...prev,
          report: {
            ...prev.report,
            images: [...existingImages, optimisticImg],
          },
        };
      });

      const updated = await issueService.uploadWorkPhoto(issue.id, file, caption);
      if (updated && updated.report.images) {
        const mergedImages = updated.report.images.map((img: any) => {
          if (img.caption === caption && (img.uploadedByRole || '').toLowerCase() === 'worker') {
            return { ...img, fallbackUrl: dataUrl };
          }
          return img;
        });
        setIssue({ ...updated, report: { ...updated.report, images: mergedImages } });
      } else {
        setIssue(updated);
      }

      flash(`Uploaded ${caption}.`);
    } catch (e: any) {
      alert(e?.message || 'Failed to upload photo');
    } finally {
      setSubmitting(null);
    }
  };

  const handleConfirmComplete = async () => {
    if (!issue) return;
    setSubmitting('complete');
    try {
      const updated = await issueService.completeWork(issue.id);
      setIssue(updated);
      setShowCompleteConfirm(false);
      flash('Work marked as complete! Resolution submitted for citizen verification.');
    } catch (e: any) {
      alert(e?.message || 'Failed to submit completion');
    } finally {
      setSubmitting(null);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6 pb-20 md:pb-6">
      <div className="flex items-center justify-between">
        <Link
          to="/worker"
          className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Worker Center
        </Link>
        <DemoBadge />
      </div>

      {successMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}
      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          {error}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-200">
                {issue.trackingNumber}
              </span>
              <IssueStatusBadge status={status as any} />
              <PriorityBadge priority={issue.priority} />
              <SeverityBadge severity={issue.severity} />
            </div>
            <h1 className="text-xl font-bold text-slate-900 mt-2">{issue.report.title}</h1>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1 flex-wrap">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>{issue.report.address} (Ward: {issue.report.ward})</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {canStart && (
              <button
                type="button"
                onClick={handleStartWork}
                disabled={submitting === 'start'}
                className="w-full sm:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow flex items-center justify-center gap-2 transition-transform active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting === 'start' ? (
                  <Clock className="w-4 h-4 animate-spin" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
                Start Repair Work
              </button>
            )}
          </div>
        </div>

        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1">
          <div className="text-xs font-bold text-slate-700">Citizen Description:</div>
          <p className="text-xs text-slate-600 leading-relaxed">{issue.report.description}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Wrench className="w-4 h-4 text-blue-600" /> Work Order Instructions
          </h3>
          <ul className="text-xs text-slate-600 space-y-2 list-disc pl-4">
            <li>Conduct initial site safety check and deploy traffic cones if needed.</li>
            <li>Take pre-repair photo evidence showing damage depth and surroundings.</li>
            <li>Apply cold asphalt patch / clean drainage line as per squad protocol.</li>
            <li>Capture clear after-repair photo evidence before leaving site.</li>
            <li>Submit resolution to notify citizen for verification.</li>
          </ul>
        </div>

        <div className="bg-gradient-to-br from-indigo-50/50 to-blue-50/30 p-5 rounded-2xl border border-blue-100 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-indigo-900 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-indigo-600" /> AI Diagnostic Report
            </h3>
            <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full">
              Live Triage
            </span>
          </div>
          {issue.aiAnalysis ? (
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between text-indigo-900">
                <span>Category Match:</span>
                <strong className="font-semibold">{issue.aiAnalysis.detectedCategory}</strong>
              </div>
              <div className="flex items-center justify-between text-indigo-900">
                <span>Confidence:</span>
                <strong className="font-semibold">
                  {Math.round(issue.aiAnalysis.confidenceScore * 100)}%
                </strong>
              </div>
              <p className="text-[11px] text-slate-600 bg-white/70 p-2.5 rounded-lg border border-indigo-100 italic">
                &quot;{issue.aiAnalysis.aiReasoning}&quot;
              </p>
            </div>
          ) : (
            <p className="text-xs text-slate-500">AI analysis pending standard triage.</p>
          )}
        </div>
      </div>

      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Camera className="w-4 h-4 text-slate-600" /> Initial Citizen Report Photos
        </h3>
        {citizenPhotos.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {citizenPhotos.map((img) => (
              <div key={img.id} className="relative rounded-xl overflow-hidden border border-slate-200 max-h-56">
                <img src={getFullImageUrl(img.url)} onError={handleImageError} alt="Citizen report evidence" className="w-full h-full object-cover" />
                <span className="absolute bottom-2 left-2 bg-slate-900/80 text-white text-[10px] px-2 py-0.5 rounded">
                  Citizen Upload
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 text-xs text-slate-500 bg-slate-50 rounded-xl">No photo submitted by citizen.</div>
        )}
      </div>

      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <FileText className="w-4 h-4 text-emerald-600" /> Resolution Evidence & Field Actions
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 border border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center text-center space-y-2 bg-slate-50/50">
            <span className="text-xs font-semibold text-slate-700">Before Photo Evidence</span>
            {beforePhoto ? (
              <div className="relative w-full h-36 rounded-lg overflow-hidden border border-slate-200">
                <img src={beforePhoto} onError={handleImageError} alt="Before work" className="w-full h-full object-cover" />
                <span className="absolute bottom-1.5 left-1.5 bg-emerald-800/90 text-white text-[10px] px-2 py-0.5 rounded">
                  Uploaded
                </span>
              </div>
            ) : (
              <div className="py-4 text-slate-400 flex flex-col items-center">
                <Camera className="w-8 h-8 text-slate-300 mb-1" />
                <span className="text-xs">No Before Photo</span>
              </div>
            )}
            <input
              ref={beforeFileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                handleUploadPhoto(file, 'Before-repair site inspection photo', 'photo-before');
                if (beforeFileRef.current) beforeFileRef.current.value = '';
              }}
            />
            <button
              type="button"
              disabled={submitting === 'photo-before'}
              onClick={() => beforeFileRef.current?.click()}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs disabled:opacity-60"
            >
              {submitting === 'photo-before' ? (
                <Clock className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Upload className="w-3.5 h-3.5" />
              )}
              Upload Before Photo
            </button>
          </div>

          <div className="p-4 border border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center text-center space-y-2 bg-slate-50/50">
            <span className="text-xs font-semibold text-slate-700">After Repair Photo Evidence</span>
            {afterPhoto ? (
              <div className="relative w-full h-36 rounded-lg overflow-hidden border border-slate-200">
                <img src={afterPhoto} onError={handleImageError} alt="After work" className="w-full h-full object-cover" />
                <span className="absolute bottom-1.5 left-1.5 bg-emerald-800/90 text-white text-[10px] px-2 py-0.5 rounded">
                  Uploaded
                </span>
              </div>
            ) : (
              <div className="py-4 text-slate-400 flex flex-col items-center">
                <Camera className="w-8 h-8 text-slate-300 mb-1" />
                <span className="text-xs">No After Photo</span>
              </div>
            )}
            <input
              ref={afterFileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                handleUploadPhoto(file, 'After-repair completion photo', 'photo-after');
                if (afterFileRef.current) afterFileRef.current.value = '';
              }}
            />
            <button
              type="button"
              disabled={submitting === 'photo-after'}
              onClick={() => afterFileRef.current?.click()}
              className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs disabled:opacity-60"
            >
              {submitting === 'photo-after' ? (
                <Clock className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Upload className="w-3.5 h-3.5" />
              )}
              Upload After Photo
            </button>
          </div>
        </div>

        <div className="space-y-2 border-t border-slate-100 pt-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-800">Worker Notes & Field Logs</span>
            <button
              type="button"
              onClick={() => setShowNoteModal(true)}
              className="text-xs text-blue-700 hover:text-blue-800 font-semibold flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Add Note
            </button>
          </div>
          {workerNotes.length === 0 ? (
            <p className="text-xs text-slate-400 italic">No notes added yet. Add a log via the button above.</p>
          ) : (
            <div className="space-y-1.5">
              {workerNotes.map((n, idx) => (
                <div key={idx} className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700">
                  {n}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => setShowCompleteConfirm(true)}
            disabled={!canComplete || submitting === 'complete'}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow flex items-center gap-2 transition-transform ${
              canComplete && submitting !== 'complete'
                ? 'bg-emerald-600 hover:bg-emerald-700 active:scale-95'
                : 'bg-slate-400 cursor-not-allowed'
            }`}
          >
            {submitting === 'complete' ? (
              <Clock className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
            Mark Work Complete & Submit
          </button>
        </div>
      </div>

      {showNoteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-5 space-y-4 border border-slate-200">
            <h3 className="text-base font-bold text-slate-900">Add Field Work Log Note</h3>
            <form onSubmit={handleAddNote} className="space-y-3">
              <textarea
                rows={3}
                required
                placeholder="e.g. Cleared debris, applied 50kg cold asphalt, traffic restored."
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
                className="w-full p-3 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNoteModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting === 'note'}
                  className="px-4 py-2 text-xs font-semibold bg-blue-700 hover:bg-blue-800 text-white rounded-lg shadow disabled:opacity-60"
                >
                  {submitting === 'note' ? 'Saving…' : 'Save Note'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={showCompleteConfirm}
        title="Submit Resolution Verification?"
        message="This action will notify the reporting citizen and municipal authority that repair work is finished with uploaded evidence."
        confirmLabel="Submit Resolution"
        cancelLabel="Back"
        variant="info"
        onConfirm={handleConfirmComplete}
        onCancel={() => setShowCompleteConfirm(false)}
      />
    </div>
  );
};
