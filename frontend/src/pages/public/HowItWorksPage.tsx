import React from 'react';
import { Link } from 'react-router-dom';
import { PublicFooter } from '../../components/common/PublicFooter';
import {
  FileText,
  Sparkles,
  AlertTriangle,
  GitMerge,
  MapPin,
  Users,
  CheckCircle,
  ThumbsUp,
  ArrowRight,
} from 'lucide-react';

export const HowItWorksPage: React.FC = () => {
  const steps = [
    {
      number: '01',
      title: 'Citizen Issue Reporting',
      icon: FileText,
      color: 'bg-blue-50 text-blue-700 border-blue-200',
      description:
        'Citizens submit complaints with exact GPS location pin, detailed description, and photo evidence via mobile web.',
      details: [
        'Automatic ward detection based on latitude/longitude',
        'Upload photo evidence of damages or overflow',
        'Unique tracking number generated immediately (e.g. CT-2026-00101)',
      ],
    },
    {
      number: '02',
      title: 'AI Auto-Categorization',
      icon: Sparkles,
      color: 'bg-sky-50 text-sky-700 border-sky-200',
      description:
        'NagarMitra analyzes the title, text description, and visual features to assign standard municipal categories.',
      details: [
        'Categories: Roads & Potholes, Water Supply, Garbage, Street Lighting, Drainage',
        'Extracts confidence scores and provides transparent reasoning',
        'Clearly tagged with "Demo AI" labels during evaluation',
      ],
    },
    {
      number: '03',
      title: 'Severity & Priority Ranking',
      icon: AlertTriangle,
      color: 'bg-amber-50 text-amber-800 border-amber-200',
      description:
        'AI evaluates safety hazard level to assign severity (Low, Medium, High, Critical) for priority queue placement.',
      details: [
        'Pressurized water main leaks flagged as Critical severity',
        'High-density arterial roads prioritized over quiet alleyways',
        'Ensures municipal teams tackle life-safety hazards first',
      ],
    },
    {
      number: '04',
      title: 'Geospatial Duplicate Detection',
      icon: GitMerge,
      color: 'bg-indigo-50 text-indigo-800 border-indigo-200',
      description:
        'Spatial clustering scans for existing complaints within 50 meters with matching issue categories.',
      details: [
        'Similarity score calculation (0–100%)',
        'Authority officers review and merge candidates with a single click',
        'All reporting citizens get subscribed to status updates of the primary ticket',
      ],
    },
    {
      number: '05',
      title: 'Ward & Department Routing',
      icon: MapPin,
      color: 'bg-purple-50 text-purple-800 border-purple-200',
      description:
        'Issues are automatically routed to the responsible ward office (e.g. Ward H/West - Bandra) and department.',
      details: [
        'Department heads view consolidated ward dashboards',
        'Automated SLA target resolution dates assigned',
        'Full audit trail of status progression',
      ],
    },
    {
      number: '06',
      title: 'Field Worker Assignment & Execution',
      icon: Users,
      color: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      description:
        'Specific repair teams and field engineers receive task dispatches on their mobile worker portal.',
      details: [
        'Worker views repair requirements and target deadline',
        'Status updates to "Work Scheduled" then "In Progress"',
        'Direct phone contact to field supervisor if required',
      ],
    },
    {
      number: '07',
      title: 'Resolution Evidence Upload',
      icon: CheckCircle,
      color: 'bg-teal-50 text-teal-800 border-teal-200',
      description:
        'Field workers submit mandatory "After" photos and completion notes before marking an issue resolved.',
      details: [
        'Mandatory photo proof of completed asphalt patch or repaired light fixture',
        'Record materials used and site disinfection status',
        'Triggers status change to "Resolution Submitted"',
      ],
    },
    {
      number: '08',
      title: 'Citizen Verification & Closure',
      icon: ThumbsUp,
      color: 'bg-rose-50 text-rose-800 border-rose-200',
      description:
        'Original reporting citizen receives notification to audit repair work and rate satisfaction.',
      details: [
        'If satisfied (1–5 stars), ticket officially closes as "Resolved"',
        'If unsatisfied, citizen can Reopen ticket with additional feedback',
        'Maintains high public trust and accountability',
      ],
    },
  ];

  return (
    <div className="space-y-12 -mx-4 -mt-4 md:-mx-6 md:-mt-6">
      {/* Header Banner */}
      <section className="bg-slate-900 text-white px-6 py-12">
        <div className="max-w-4xl mx-auto text-center space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-sky-400">
            End-to-End Workflow
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight">How NagarMitra Works</h1>
          <p className="text-xs md:text-sm text-slate-300 max-w-2xl mx-auto">
            From citizen photo report to field repair evidence and final verification. Transparent, automated, and accountable at every stage.
          </p>
        </div>
      </section>

      {/* Steps List */}
      <section className="max-w-5xl mx-auto px-4 md:px-6 space-y-8">
        <div className="space-y-6">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.number}
                className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row gap-6 items-start"
              >
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-sm font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-lg">
                    {step.number}
                  </span>
                  <div className={`p-3 rounded-xl border ${step.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                </div>

                <div className="space-y-2 flex-1">
                  <h3 className="text-base font-bold text-slate-900">{step.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{step.description}</p>
                  <ul className="pt-2 space-y-1.5 border-t border-slate-100">
                    {step.details.map((detail, idx) => (
                      <li key={idx} className="text-xs text-slate-500 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" />
                        <span>{detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA Box */}
      <section className="max-w-5xl mx-auto px-4 md:px-6">
        <div className="bg-blue-900 text-white rounded-xl p-8 text-center space-y-4 shadow-md">
          <h2 className="text-xl font-bold">Experience the workflow in action</h2>
          <p className="text-xs text-blue-200 max-w-xl mx-auto">
            Try out Citizen, Authority, Worker, and Admin interfaces with preloaded Mumbai ward sample data.
          </p>
          <div className="pt-2">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-blue-900 font-semibold text-xs rounded-lg hover:bg-blue-50 transition-colors"
            >
              Open Role-Aware Demo Portal <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
};
