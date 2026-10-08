import React from 'react';
import { Link } from 'react-router-dom';
import { CivicLogo } from './CivicLogo';
import { ShieldCheck, FileText, ArrowRight } from 'lucide-react';

export const PublicFooter: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4 md:col-span-1">
            <div className="bg-white p-2 rounded-xl inline-block">
              <CivicLogo size="sm" showSubtext={false} />
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Smart Civic Issue Reporting & Tracking Platform (PS-16). Streamlining citizen complaints, AI prioritization, duplicate detection, and authority resolution workflows.
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Municipal Operations Standard</span>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-100 mb-3">
              Platform
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/" className="hover:text-white transition-colors">
                  Home Overview
                </Link>
              </li>
              <li>
                <Link to="/how-it-works" className="hover:text-white transition-colors">
                  How It Works
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-white transition-colors">
                  About PS-16 Project
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-white transition-colors">
                  Access Portal
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-100 mb-3">
              User Portals
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/login" className="hover:text-white transition-colors flex items-center gap-1">
                  Citizen Reporting <ArrowRight className="w-3 h-3 text-slate-500" />
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-white transition-colors flex items-center gap-1">
                  Authority Dashboard <ArrowRight className="w-3 h-3 text-slate-500" />
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-white transition-colors flex items-center gap-1">
                  Field Worker App <ArrowRight className="w-3 h-3 text-slate-500" />
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-white transition-colors flex items-center gap-1">
                  Admin Governance <ArrowRight className="w-3 h-3 text-slate-500" />
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-100 mb-3">
              Civic Accountability
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed mb-3">
              Built for transparent municipal service delivery, evidence-backed issue resolution, and dual-party verification.
            </p>
            <div className="p-3 bg-slate-800 rounded-lg border border-slate-700 text-[11px] text-slate-300 flex items-center gap-2">
              <FileText className="w-4 h-4 text-sky-400 shrink-0" />
              <span>Demonstration Prototype (PS-16)</span>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between text-xs text-slate-500">
          <p>© 2026 NagarMitra Platform. All rights reserved.</p>
          <div className="flex gap-4 mt-3 md:mt-0">
            <span className="hover:text-slate-400 cursor-pointer">Privacy Notice</span>
            <span className="hover:text-slate-400 cursor-pointer">Terms of Service</span>
            <span className="hover:text-slate-400 cursor-pointer">Accessibility</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
