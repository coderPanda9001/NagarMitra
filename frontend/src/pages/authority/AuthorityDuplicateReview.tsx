import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { issueService, DuplicateCandidateRaw } from '../../services/issueService';
import { Issue } from '../../types';
import { DemoBadge } from '../../components/common/DemoBadge';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { LoadingState } from '../../components/common/LoadingState';
import { ErrorState } from '../../components/common/ErrorState';
import { GitMerge, Check, Eye, Sparkles, MapPin, AlertTriangle } from 'lucide-react';
import { getImageUrl, handleImageError } from '../../utils/imageUtils';

export const AuthorityDuplicateReview: React.FC = () => {
  const [primaryIssue, setPrimaryIssue] = useState<Issue | null>(null);
  const [candidateIssue, setCandidateIssue] = useState<Issue | null>(null);
  const [candidateRaw, setCandidateRaw] = useState<DuplicateCandidateRaw | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmMergeOpen, setConfirmMergeOpen] = useState(false);
  const [mergedSuccess, setMergedSuccess] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const all = await issueService.getIssues();
        const master = all.find((i) => i.id === 'iss-master-1') || all.find((i) => !i.isDuplicate) || all[0];
        if (!master) {
          setError('No issues available for duplicate triage.');
          setLoading(false);
          return;
        }

        setPrimaryIssue(master);

        const cands = await issueService.checkDuplicates(
          master.report.latitude,
          master.report.longitude,
          master.report.title,
          master.report.description,
          master.report.category
        );
        const linkedChildren = master.linkedChildIds || [];
        let match = cands.find((c) => linkedChildren.includes(c.candidate_issue_id));
        if (!match && cands.length > 0) match = cands[0];

        if (match) {
          setCandidateRaw(match);
          let child = await issueService.getIssueById(match.candidate_issue_id);
          if (!child && all.length > 1) {
            child = all.find((i) => i.id !== master.id) || undefined;
          }
          setCandidateIssue(child || null);
        } else {
          if (all.length > 1) {
            setCandidateIssue(all.find((i) => i.id !== master.id) || null);
          }
        }
      } catch (e: any) {
        setError(e?.message || 'Failed to load duplicate triage data.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const similarityMetrics = useMemo(() => {
    if (candidateRaw) {
      const base = [
        { label: 'Geospatial Location', score: Math.round((candidateRaw.loc_score || 0) * 100), desc: `${candidateRaw.distance_meters.toFixed(1)}m distance radius` },
        { label: 'Semantic Description', score: Math.round((candidateRaw.text_score || 0) * 100), desc: 'NLP text + embedding cosine similarity' },
        { label: 'Issue Category Taxonomy', score: Math.round((candidateRaw.cat_score || 0) * 100), desc: `Match: ${candidateRaw.cat_score === 1 ? 'Exact' : 'Partial'}` },
        { label: 'Time Proximity Decay', score: Math.round((candidateRaw.time_score || 0) * 100), desc: '14-day exponential half-life window' },
      ];
      if (typeof candidateRaw.image_score === 'number') {
        base.push({
          label: 'Visual Image Hash Match',
          score: Math.round(candidateRaw.image_score * 100),
          desc: 'Average-hash Hamming similarity (8x8 grayscale)',
        });
      }
      return base;
    }
    return [
      { label: 'Geospatial Location', score: 0, desc: 'No candidate loaded from API yet' },
      { label: 'Semantic Description', score: 0, desc: '' },
      { label: 'Issue Category Taxonomy', score: 0, desc: '' },
      { label: 'Time Proximity Decay', score: 0, desc: '' },
    ];
  }, [candidateRaw]);

  const overallScore = candidateRaw ? candidateRaw.similarity_score : similarityMetrics.reduce((a, b) => a + b.score, 0) / Math.max(1, similarityMetrics.length);
  const overallLabel = candidateRaw?.classification || (overallScore >= 72 ? 'Duplicate' : overallScore >= 45 ? 'Related' : 'New');

  if (loading) return <LoadingState message="Fetching duplicate candidate matches from backend..." />;
  if (error) return <ErrorState message={error} />;
  if (!primaryIssue) return <ErrorState message="No primary issue available for duplicate review triage." />;

  const handleConfirmMerge = async () => {
    if (!primaryIssue || !candidateIssue) return;
    try {
      await issueService.mergeIssue(candidateIssue.id, primaryIssue.id);
      setConfirmMergeOpen(false);
      setMergedSuccess(true);
      setTimeout(() => setMergedSuccess(false), 6000);
    } catch (e: any) {
      alert(e?.message || 'Failed to merge');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl font-bold text-slate-900">Geospatial Duplicate Triage</h1>
            <DemoBadge label="Live Backend Scoring" />
          </div>
          <p className="text-xs text-slate-500">
            100m haversine radius with 4-factor weighted scoring: Location 35%, Text 35%, Category 15%, Time 15%.
            Image average-hash similarity included when both reports have uploaded photos.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            disabled={!candidateIssue}
            onClick={() => setConfirmMergeOpen(true)}
            className="px-4 py-2 bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-bold rounded-lg shadow-sm transition-colors flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <GitMerge className="w-4 h-4" /> Execute Ticket Merge
          </button>
          <button
            onClick={() => alert('Duplicate suggestion dismissed; tickets kept separate in triage queue.')}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg transition-colors"
          >
            Keep Separate
          </button>
        </div>
      </div>

      {mergedSuccess && (
        <div className="p-4 bg-emerald-100 border border-emerald-300 text-emerald-900 rounded-xl text-xs font-semibold flex items-center gap-2">
          <Check className="w-5 h-5 text-emerald-700" />
          Tickets successfully merged! Linked complaint subscribed to primary ticket updates.
        </div>
      )}

      <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-5 space-y-4 shadow-xs">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <span className="font-bold text-indigo-950 text-xs flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-indigo-600" /> Overall Similarity Score: {overallScore.toFixed(1)}% —{' '}
            <span
              className={
                overallLabel === 'Duplicate'
                  ? 'text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200'
                  : overallLabel === 'Related'
                  ? 'text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200'
                  : 'text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200'
              }
            >
              {overallLabel}
            </span>
          </span>
          {candidateRaw && (
            <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded border border-indigo-200">
              {candidateRaw.reason}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {similarityMetrics.map((m) => (
            <div key={m.label} className="bg-white p-3 rounded-lg border border-indigo-100 space-y-1">
              <div className="flex justify-between font-semibold text-slate-800">
                <span>{m.label}</span>
                <span className="text-indigo-700 font-bold">{m.score}%</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, m.score)}%` }}
                />
              </div>
              {m.desc && <span className="text-[10px] text-slate-400 block">{m.desc}</span>}
            </div>
          ))}
        </div>

        {!candidateRaw && (
          <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
            No nearby candidates matched 100m radius + 0.45 threshold from backend. Reviewer can compare last-seeded pair below.
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border-2 border-blue-600 p-5 space-y-4 shadow-sm relative">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <span className="px-2.5 py-0.5 text-xs font-bold bg-blue-100 text-blue-800 rounded border border-blue-200">
              Primary Master Ticket
            </span>
            <span className="font-mono font-bold text-slate-500 text-xs">{primaryIssue.trackingNumber}</span>
          </div>

          <div className="h-44 rounded-lg overflow-hidden bg-slate-100 border border-slate-200">
            {primaryIssue.report.images[0] ? (
              <img
                src={getImageUrl(primaryIssue.report.images[0].url)}
                onError={handleImageError}
                alt="Primary"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">
                No Photo Attached
              </div>
            )}
          </div>

          <div className="space-y-2 text-xs">
            <h3 className="font-bold text-slate-900 text-sm">{primaryIssue.report.title}</h3>
            <p className="text-slate-600 leading-relaxed bg-slate-50 p-2.5 rounded border border-slate-100">
              "{primaryIssue.report.description}"
            </p>
            <div className="flex items-center gap-1 text-slate-500 pt-1">
              <MapPin className="w-3.5 h-3.5 text-blue-700" />
              <span>{primaryIssue.report.address} ({primaryIssue.report.ward})</span>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <Link
              to={`/authority/master/${primaryIssue.id}`}
              className="text-xs font-semibold text-blue-700 hover:underline flex items-center gap-1"
            >
              <Eye className="w-3.5 h-3.5" /> View Full Master Ticket
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-300 p-5 space-y-4 shadow-xs relative">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <span className="px-2.5 py-0.5 text-xs font-bold bg-amber-100 text-amber-800 rounded border border-amber-200">
              Candidate Duplicate Report
            </span>
            <span className="font-mono font-bold text-slate-500 text-xs">
              {candidateIssue?.trackingNumber || '[no candidate]'}
            </span>
          </div>

          <div className="h-44 rounded-lg overflow-hidden bg-slate-100 border border-slate-200">
            {candidateIssue?.report.images?.[0] ? (
              <img
                src={getImageUrl(candidateIssue.report.images[0].url)}
                onError={handleImageError}
                alt="Candidate"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">
                No Photo Attached
              </div>
            )}
          </div>

          {candidateIssue ? (
            <div className="space-y-2 text-xs">
              <h3 className="font-bold text-slate-900 text-sm">{candidateIssue.report.title}</h3>
              <p className="text-slate-600 leading-relaxed bg-slate-50 p-2.5 rounded border border-slate-100">
                "{candidateIssue.report.description}"
              </p>
              <div className="flex items-center gap-1 text-slate-500 pt-1">
                <MapPin className="w-3.5 h-3.5 text-amber-600" />
                <span>{candidateIssue.report.address} ({candidateIssue.report.ward})</span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic">No matching candidate from backend.</p>
          )}

          <div className="pt-2 flex justify-end">
            {candidateIssue && (
              <Link
                to={`/authority/master/${candidateIssue.id}`}
                className="text-xs font-semibold text-blue-700 hover:underline flex items-center gap-1"
              >
                <Eye className="w-3.5 h-3.5" /> View Ticket Record
              </Link>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={confirmMergeOpen}
        title="Confirm Duplicate Merge"
        message={
          candidateIssue
            ? `Are you sure you want to merge ticket ${candidateIssue.trackingNumber} into master ticket ${primaryIssue.trackingNumber}? Both citizens will receive unified status updates. Original child report is preserved (never deleted).`
            : 'No candidate selected for merge.'
        }
        confirmLabel="Execute Ticket Merge"
        variant="info"
        onConfirm={handleConfirmMerge}
        onCancel={() => setConfirmMergeOpen(false)}
      />
    </div>
  );
};
