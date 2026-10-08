import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { analyticsService } from '../../services/analyticsService';
import { AnalyticsSummary } from '../../types';
import { StatCard } from '../../components/common/StatCard';
import { DemoBadge } from '../../components/common/DemoBadge';
import { DemoMapPreview } from '../../components/map/DemoMapPreview';
import { PublicFooter } from '../../components/common/PublicFooter';
import {
  FileText,
  Sparkles,
  GitMerge,
  ShieldCheck,
  ArrowRight,
  AlertTriangle,
  Clock,
  EyeOff,
  CheckCircle2,
  Search,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const [stats, setStats] = useState<AnalyticsSummary | null>(null);

  useEffect(() => {
    analyticsService.getSummary().then(setStats);
  }, []);

  return (
    <div className="space-y-16 -mx-4 -mt-4 md:-mx-6 md:-mt-6">
      {/* Hero Section */}
      <section className="bg-slate-900 text-white px-6 py-20 md:py-28 relative overflow-hidden">
        <div className="max-w-5xl mx-auto text-center space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-900/60 border border-blue-700 text-sky-300 text-xs font-semibold">
            <Sparkles className="w-4 h-4 text-sky-400" />
            PS-16 Smart Civic Issue Reporting & Tracking Platform
          </div>

          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight leading-tight text-white">
            Report. Track. Resolve.
          </h1>

          <p className="text-base md:text-lg text-slate-300 max-w-3xl mx-auto font-normal leading-relaxed">
            Eliminate lost complaints, duplicate tickets, and unverified repairs. Powered by AI categorization, automatic duplicate merging, and transparent municipal action tracking.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Link
              to="/login"
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-md transition-colors flex items-center gap-2 text-sm"
            >
              <FileText className="w-4 h-4" /> Report an Issue
            </Link>
            <Link
              to="/how-it-works"
              className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl border border-slate-700 transition-colors flex items-center gap-2 text-sm"
            >
              Explore How It Works <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/login"
              className="px-6 py-3 bg-slate-100 hover:bg-white text-slate-900 font-semibold rounded-xl transition-colors text-sm"
            >
              Login to Portal
            </Link>
          </div>
        </div>
      </section>

      {/* Statistics Section (Labeled Demo Data) */}
      <section className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Citywide Civic Metrics</h2>
            <p className="text-xs text-slate-500">Real-time breakdown of municipal complaints and resolutions</p>
          </div>
          <DemoBadge label="Demo data" />
        </div>

        {stats ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              title="Total Reported"
              value={stats.totalReported}
              subtitle="Citywide grievances"
              icon={FileText}
              variant="default"
            />
            <StatCard
              title="Resolved Issues"
              value={stats.totalResolved}
              subtitle="Verified fixes"
              icon={ShieldCheck}
              variant="success"
            />
            <StatCard
              title="Duplicates Merged"
              value={stats.duplicatesMerged}
              subtitle="Prevented repetitive work"
              icon={GitMerge}
              variant="accent"
            />
            <StatCard
              title="Avg Resolution Time"
              value={`${stats.avgResolutionHours} hrs`}
              subtitle="From report to completion"
              icon={Clock}
              variant="warning"
            />
          </div>
        ) : (
          <div className="p-8 text-center text-slate-400">Loading civic metrics...</div>
        )}
      </section>

      {/* Problem Section */}
      <section className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-xs font-bold uppercase tracking-wider text-rose-600">The Problem</span>
          <h2 className="text-2xl font-bold text-slate-900 mt-1">Why Traditional Civic Reporting Fails</h2>
          <p className="text-xs text-slate-500 mt-1">
            Citizens and ward authorities struggle with unmanaged grievance backlogs.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-2">
            <div className="p-2 bg-rose-50 text-rose-700 rounded-lg w-fit">
              <EyeOff className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900">Lost Complaints</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Paper slips and unorganized portals cause critical potholes and leaks to fall through cracks.
            </p>
          </div>

          <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-2">
            <div className="p-2 bg-amber-50 text-amber-700 rounded-lg w-fit">
              <GitMerge className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900">Duplicate Overload</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Multiple citizens report the same broken streetlight, creating repetitive administrative noise.
            </p>
          </div>

          <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-2">
            <div className="p-2 bg-orange-50 text-orange-700 rounded-lg w-fit">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900">Poor Prioritization</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              High-danger water bursts get queued behind minor aesthetic complaints due to lack of severity ranking.
            </p>
          </div>

          <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-2">
            <div className="p-2 bg-slate-100 text-slate-700 rounded-lg w-fit">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900">Zero Status Visibility</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Citizens are left in the dark without live tracking or post-repair verification mechanisms.
            </p>
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="bg-slate-100 py-12 px-4 md:px-6">
        <div className="max-w-7xl mx-auto space-y-10">
          <div className="text-center max-w-2xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-700">The Solution</span>
            <h2 className="text-2xl font-bold text-slate-900 mt-1">NagarMitra Smart Platform</h2>
            <p className="text-xs text-slate-500 mt-1">
              End-to-end intelligent orchestration from citizen submission to field repair verification.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-xs space-y-3">
              <div className="p-2.5 bg-blue-100 text-blue-800 rounded-lg w-fit">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-slate-900">AI Auto-Categorization</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Natural language & image inspection instantly classifies reports into Roads, Water, Sanitation, or Electrical.
              </p>
            </div>

            <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-xs space-y-3">
              <div className="p-2.5 bg-indigo-100 text-indigo-800 rounded-lg w-fit">
                <Search className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-slate-900">GPS Duplicate Detection</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Spatial clustering algorithms identify nearby reports within 50 meters and suggest single-click merging.
              </p>
            </div>

            <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-xs space-y-3">
              <div className="p-2.5 bg-emerald-100 text-emerald-800 rounded-lg w-fit">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-slate-900">Dual Resolution Verification</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Field workers upload post-repair photos. Citizens receive confirmation requests to verify satisfaction.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Flow Strip */}
      <section className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="text-center max-w-xl mx-auto mb-8">
          <h2 className="text-xl font-bold text-slate-900">Core Workflow Lifecycle</h2>
          <p className="text-xs text-slate-500">6 step lifecycle ensuring total municipal accountability</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 text-center">
          {[
            { step: '01', title: 'Report', desc: 'Location & Photo' },
            { step: '02', title: 'AI Analysis', desc: 'Auto Taxonomy' },
            { step: '03', title: 'Duplicate Check', desc: 'Geospatial Merge' },
            { step: '04', title: 'Prioritize', desc: 'Severity Score' },
            { step: '05', title: 'Assign & Fix', desc: 'Field Work Team' },
            { step: '06', title: 'Verify', desc: 'Citizen Audit' },
          ].map((item, index) => (
            <div key={item.step} className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs relative">
              <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                Step {item.step}
              </span>
              <h4 className="text-xs font-bold text-slate-900 mt-2">{item.title}</h4>
              <p className="text-[10px] text-slate-500 mt-0.5">{item.desc}</p>
              {index < 5 && (
                <div className="hidden md:block absolute -right-2 top-1/2 -translate-y-1/2 z-10 text-slate-300">
                  <ArrowRight className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Map Preview Section */}
      <section className="max-w-7xl mx-auto px-4 md:px-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Live Ward Issue Map</h2>
            <p className="text-xs text-slate-500">Interactive spatial tracking of active complaints across Mumbai Wards</p>
          </div>
          <Link
            to="/login"
            className="text-xs font-semibold text-blue-700 hover:text-blue-800 flex items-center gap-1 w-fit"
          >
            Access Full Authority Map <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <DemoMapPreview />
      </section>

      {/* CTA Box */}
      <section className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="bg-slate-900 text-white rounded-2xl p-8 md:p-12 text-center space-y-4 shadow-xl">
          <h2 className="text-2xl md:text-3xl font-bold">Ready to improve civic infrastructure?</h2>
          <p className="text-xs md:text-sm text-slate-300 max-w-xl mx-auto">
            Log in to your role dashboard or register as a citizen to submit and track municipal issues.
          </p>
          <div className="flex flex-wrap justify-center gap-4 pt-2">
            <Link
              to="/register"
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded-xl transition-colors"
            >
              Citizen Registration
            </Link>
            <Link
              to="/login"
              className="px-5 py-2.5 bg-white hover:bg-slate-100 text-slate-900 font-medium text-xs rounded-xl transition-colors"
            >
              Sign In to Portal
            </Link>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
};
