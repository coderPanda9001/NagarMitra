import React from 'react';
import { PublicFooter } from '../../components/common/PublicFooter';
import { DemoBadge } from '../../components/common/DemoBadge';
import {
  ShieldCheck,
  Target,
  Code2,
  Cpu,
  Building2,
  Users,
  Wrench,
  UserCheck,
} from 'lucide-react';

export const AboutPage: React.FC = () => {
  return (
    <div className="space-y-12 -mx-4 -mt-4 md:-mx-6 md:-mt-6">
      {/* Header Banner */}
      <section className="bg-slate-900 text-white px-6 py-12">
        <div className="max-w-4xl mx-auto text-center space-y-3">
          <div className="flex items-center justify-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-sky-400">
              Problem Statement PS-16
            </span>
            <DemoBadge label="Demo Platform" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">About NagarMitra</h1>
          <p className="text-xs md:text-sm text-slate-300 max-w-2xl mx-auto">
            Smart Civic Issue Reporting & Tracking Platform engineered for modern municipal governance, transparent complaint resolution, and data-driven ward administration.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="max-w-5xl mx-auto px-4 md:px-6 space-y-10">
        {/* Core Objective */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-blue-700 font-bold text-base">
            <Target className="w-5 h-5" />
            <h2>Problem Statement & Purpose</h2>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            In urban municipalities, citizens frequently report potholes, non-functional streetlights, garbage overflow, and pipe leaks. However, complaints often get lost in bureaucracy, duplicated by multiple residents, ignored due to poor prioritization, or marked resolved without physical verification.
          </p>
          <p className="text-xs text-slate-600 leading-relaxed">
            <strong>NagarMitra (PS-16)</strong> bridges this gap by providing an end-to-end digital platform that streamlines complaint ingestion, automates issue categorization via AI, detects geospatial duplicates, prioritizes life-safety emergencies, dispatches field teams, and enforces citizen-verified resolution.
          </p>
        </div>

        {/* Stakeholder Roles */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-700" /> Stakeholder Ecosystem
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-2">
              <div className="p-2 bg-blue-50 text-blue-700 rounded-lg w-fit">
                <UserCheck className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold text-slate-900">Citizen</h3>
              <p className="text-[11px] text-slate-500 leading-normal">
                Submits geotagged photo reports, tracks live progress, and audits final resolution quality.
              </p>
            </div>

            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-2">
              <div className="p-2 bg-indigo-50 text-indigo-700 rounded-lg w-fit">
                <Building2 className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold text-slate-900">Authority / Officer</h3>
              <p className="text-[11px] text-slate-500 leading-normal">
                Reviews AI triage, merges duplicate tickets, assigns departments/teams, and monitors ward SLAs.
              </p>
            </div>

            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-2">
              <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg w-fit">
                <Wrench className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold text-slate-900">Field Worker</h3>
              <p className="text-[11px] text-slate-500 leading-normal">
                Receives assigned repair dispatches, updates job progress, and uploads "After" photo proof.
              </p>
            </div>

            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-2">
              <div className="p-2 bg-slate-100 text-slate-700 rounded-lg w-fit">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold text-slate-900">Admin</h3>
              <p className="text-[11px] text-slate-500 leading-normal">
                Manages ward boundaries, municipal departments, user accounts, and system configuration.
              </p>
            </div>
          </div>
        </div>

        {/* Technical Stack */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
            <Code2 className="w-5 h-5 text-blue-700" />
            <h2>Technical Stack & Design Principles</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-600">
            <div className="space-y-2 p-3 bg-slate-50 rounded-lg border border-slate-100">
              <h4 className="font-semibold text-slate-900">Frontend Technology</h4>
              <p>Built with React 19, TypeScript, Vite, Tailwind CSS, TanStack Query, React Hook Form, Zod, Recharts, and React Leaflet.</p>
            </div>
            <div className="space-y-2 p-3 bg-slate-50 rounded-lg border border-slate-100">
              <h4 className="font-semibold text-slate-900">Clean Civic-Tech UI</h4>
              <p>Designed with serious, accessible civic aesthetic. Avoids unnecessary heavy gradients or decorative glassmorphism.</p>
            </div>
          </div>
        </div>

        {/* AI Transparency Notice */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 space-y-2">
          <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
            <Cpu className="w-4 h-4 text-amber-700" />
            <span>AI Transparency & Demo Data Disclosure</span>
          </div>
          <p className="text-xs text-amber-800 leading-relaxed">
            In accordance with platform development rules, all AI categorization, confidence scores, and duplicate detection candidates in this demonstration application are generated via simulation services labeled with <strong>"Demo AI"</strong> / <strong>"Demo Data"</strong> badges. No fake metrics are presented as real server backends.
          </p>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
};
