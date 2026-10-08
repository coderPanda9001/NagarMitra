import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { analyticsService } from '../../services/analyticsService';
import { AnalyticsSummary } from '../../types';
import { DemoBadge } from '../../components/common/DemoBadge';
import { StatCard } from '../../components/common/StatCard';
import { LoadingState } from '../../components/common/LoadingState';
import {
  Users,
  Building2,
  AlertTriangle,
  Activity,
  CheckCircle2,
  Clock,
  ArrowRight,
  Sparkles,
  Layers
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analyticsService.getSummary().then((sumData) => {
      setAnalytics(sumData);
      setLoading(false);
    });
  }, []);

  if (loading) return <LoadingState message="Loading administrative dashboard..." />;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900">System Administration & Control Center</h1>
            <DemoBadge />
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Global civic issue governance, system health, and role access management
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/admin/users"
            className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-semibold shadow flex items-center gap-2 transition-colors"
          >
            <Users className="w-4 h-4" /> Manage Platform Users
          </Link>
          <Link
            to="/admin/health"
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold shadow flex items-center gap-2 transition-colors"
          >
            <Activity className="w-4 h-4 text-emerald-400" /> System Uptime & Services
          </Link>
        </div>
      </div>

      {/* 4 Primary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Registered Users"
          value="14,280"
          subtitle="Citizens, Authorities & Workers"
          icon={Users}
          trend={{ value: '12%', isPositive: true }}
          variant="accent"
        />
        <StatCard
          title="Active Departments"
          value="18 Wards"
          subtitle="BMC Municipal Wards"
          icon={Building2}
          variant="default"
        />
        <StatCard
          title="Platform Issues Managed"
          value={analytics?.totalReported.toString() || '1,482'}
          subtitle="Total logged complaints"
          icon={AlertTriangle}
          variant="warning"
        />
        <StatCard
          title="SLA Compliance Rate"
          value="92%"
          subtitle="Resolved within target hours"
          icon={CheckCircle2}
          trend={{ value: '4%', isPositive: true }}
          variant="success"
        />
      </div>

      {/* Overview Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Management Shortcuts */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
          <h2 className="text-base font-bold text-slate-900">Platform Configuration Modules</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link
              to="/admin/users"
              className="p-4 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/40 transition-colors flex items-start gap-3 group"
            >
              <div className="p-2.5 bg-blue-100 text-blue-700 rounded-lg group-hover:scale-105 transition-transform">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-700">
                  User Permissions & Roles
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Grant Citizen, Authority, Worker, or Admin privileges.
                </p>
              </div>
            </Link>

            <Link
              to="/admin/sla"
              className="p-4 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/40 transition-colors flex items-start gap-3 group"
            >
              <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-lg group-hover:scale-105 transition-transform">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-700">
                  SLA Target & Escalation Rules
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Configure resolution deadlines per category and severity.
                </p>
              </div>
            </Link>

            <Link
              to="/admin/departments"
              className="p-4 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/40 transition-colors flex items-start gap-3 group"
            >
              <div className="p-2.5 bg-purple-100 text-purple-700 rounded-lg group-hover:scale-105 transition-transform">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-700">
                  Municipal Wards & Departments
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Manage department heads and field squad assignments.
                </p>
              </div>
            </Link>

            <Link
              to="/admin/categories"
              className="p-4 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/40 transition-colors flex items-start gap-3 group"
            >
              <div className="p-2.5 bg-amber-100 text-amber-700 rounded-lg group-hover:scale-105 transition-transform">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-700">
                  Issue Taxonomy & Categories
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Define issue sub-types, priorities, and default routes.
                </p>
              </div>
            </Link>
          </div>
        </div>

        {/* AI & System Health Widget */}
        <div className="bg-gradient-to-br from-slate-900 to-indigo-950 rounded-2xl p-6 text-white shadow-md flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> AI Engine Health
              </span>
              <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-[10px] font-bold rounded border border-emerald-400/30">
                Operational
              </span>
            </div>
            <h3 className="text-lg font-bold mt-2">CivicAI Triage & Deduplication</h3>
            <p className="text-xs text-slate-300 mt-1">
              Active duplicate detection threshold set at 85% confidence. 94.2% AI classification accuracy in Ward K-West.
            </p>
          </div>

          <div className="space-y-2 text-xs border-t border-slate-800 pt-3">
            <div className="flex justify-between text-slate-300">
              <span>Speech-to-Text Engine:</span>
              <strong className="text-emerald-400">Connected (Demo)</strong>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>Spatial GIS Clustering:</span>
              <strong className="text-emerald-400">Online</strong>
            </div>
          </div>

          <Link
            to="/admin/health"
            className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors"
          >
            Open System Health Monitor <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
};
