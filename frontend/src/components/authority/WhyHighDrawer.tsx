import React, { useEffect, useState } from 'react';
import { Issue } from '../../types';
import { DemoBadge } from '../common/DemoBadge';
import { SeverityBadge } from '../common/SeverityBadge';
import { issueService, PriorityFactorsResponse } from '../../services/issueService';
import { X, Sparkles, MapPin, Users, Clock, AlertTriangle, Info, Activity, BarChart3 } from 'lucide-react';

interface WhyHighDrawerProps {
  issue: Issue | null;
  isOpen?: boolean;
  onClose: () => void;
}

const ICON_MAP: Record<string, React.FC<any>> = {
  'AI Severity': Sparkles,
  'Citizen Support': Users,
  'Age / SLA Elapsed': Clock,
  'Recurrent Hotspot': Activity,
};

const DEFAULT_ICON = BarChart3;

function colorForPriority(p: string) {
  switch ((p || '').toLowerCase()) {
    case 'critical':
      return 'text-rose-900 bg-rose-50 border-rose-200';
    case 'high':
      return 'text-amber-900 bg-amber-50 border-amber-200';
    case 'medium':
      return 'text-sky-900 bg-sky-50 border-sky-200';
    case 'low':
    default:
      return 'text-slate-700 bg-slate-50 border-slate-200';
  }
}

export const WhyHighDrawer: React.FC<WhyHighDrawerProps> = ({ issue, isOpen = true, onClose }) => {
  const [factors, setFactors] = useState<PriorityFactorsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!issue || !isOpen) {
      setFactors(null);
      setError(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    issueService
      .getPriorityFactors(issue.id)
      .then((res) => {
        if (cancelled) return;
        setFactors(res);
      })
      .catch((e: any) => !cancelled && setError(e?.message || 'Failed to load priority factors'))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [issue?.id]);

  if (!issue) return null;

  const tier = factors?.priority || issue.priority;
  const totalScore = factors?.totalScore ?? (factors?.factors?.reduce((a, b) => a + b.points, 0) || 0);

  const fallbackFactors = [
    {
      icon: Sparkles,
      title: 'AI High Severity Classification',
      desc: issue.aiAnalysis?.aiReasoning || 'Civic classifier detected high-impact category.',
      score: '+30 pts',
    },
    {
      icon: MapPin,
      title: 'Location Sensitivity',
      desc: `Located on ${issue.report.address}.`,
      score: '+10 pts',
    },
    {
      icon: Users,
      title: `Citizen Support: ${issue.supportingCount || 1} reports`,
      desc: 'Neighborhood reports contributing to urgency.',
      score: `+${Math.min(25, ((issue.supportingCount || 1) - 1) * 5)} pts`,
    },
    {
      icon: Clock,
      title: 'Ticket Age',
      desc: 'Issue open duration approaching SLA threshold.',
      score: '+5 pts',
    },
  ];

  const headline =
    factors && factors.factors.length > 0
      ? factors.factors
      : null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs">
      <div className="w-full max-w-md bg-white h-full shadow-2xl p-6 overflow-y-auto space-y-6 animate-in slide-in-from-right duration-200">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-lg font-bold text-slate-900">Why {tier} Priority?</h2>
            <DemoBadge label="Rule-Based Priority Engine" />
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="font-mono font-bold text-slate-500">{issue.trackingNumber}</span>
            <SeverityBadge severity={issue.severity} size="sm" />
          </div>
          <h3 className="font-bold text-slate-900 text-sm">{issue.report.title}</h3>
          <p className="text-slate-600 line-clamp-2">{issue.report.description}</p>

          <div className={`p-3 rounded-lg border mt-2 font-bold ${colorForPriority(tier)}`}>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Info className="w-4 h-4" />
                Final Priority Score
              </span>
              <span className="text-sm">
                {tier} · {totalScore}/100
              </span>
            </div>
            {factors?.explanation && (
              <p className="font-normal text-[11px] mt-1 opacity-90">{factors.explanation}</p>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Priority Score Breakdown{' '}
            <span className="normal-case tracking-normal">
              (loading: {loading ? '…' : headline ? 'Live' : 'Fallback'})
            </span>
          </h3>

          {loading && (
            <div className="space-y-3 animate-pulse">
              {[0, 1, 2].map((i) => (
                <div key={i} className="p-3 h-16 bg-slate-100 rounded-xl border border-slate-200" />
              ))}
            </div>
          )}

          {!loading && error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              {error} — Showing fallback heuristics.
            </div>
          )}

          {!loading && headline && (
            <div className="space-y-3">
              {headline.map((f, idx) => {
                const Icon = ICON_MAP[f.factor] || DEFAULT_ICON;
                return (
                  <div
                    key={`${f.factor}-${idx}`}
                    className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-1 shadow-2xs hover:border-blue-300 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-bold text-slate-900 text-xs">
                        <Icon className="w-4 h-4 text-blue-700 shrink-0" />
                        <span>{f.factor}</span>
                      </div>
                      <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        +{f.points} pts
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 pl-6">{String(f.value)}</p>
                  </div>
                );
              })}
            </div>
          )}

          {!loading && !headline && (
            <div className="space-y-3">
              {fallbackFactors.map((f, idx) => {
                const Icon = f.icon;
                return (
                  <div
                    key={idx}
                    className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-1 shadow-2xs hover:border-blue-300 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-bold text-slate-900 text-xs">
                        <Icon className="w-4 h-4 text-blue-700 shrink-0" />
                        <span>{f.title}</span>
                      </div>
                      <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        {f.score}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 pl-6">{f.desc}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold">Priority Engine — Weighted Rule-Set</p>
            <p>
              AI Severity (10/20/30/40) + Citizen Support (max 25) + Age/SLA (max 20) + Recurrent
              Hotspot (+15). Tiers: Low &lt; 30, Medium &lt; 45, High &lt; 65, Critical ≥ 65.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
