import React, { useEffect, useState } from 'react';
import { analyticsService } from '../../services/analyticsService';
import { issueService } from '../../services/issueService';
import { AnalyticsSummary, Issue } from '../../types';
import { StatCard } from '../../components/common/StatCard';
import { DemoBadge } from '../../components/common/DemoBadge';
import { DemoMapPreview } from '../../components/map/DemoMapPreview';
import { LoadingState } from '../../components/common/LoadingState';

// Recharts components
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
  Legend,
} from 'recharts';

import {
  FileText,
  AlertTriangle,
  Clock,
  CheckCircle2,
  RotateCcw,
  GitMerge,
  BarChart3,
  MapPin,
  TrendingUp,
} from 'lucide-react';

export const AuthorityDashboard: React.FC = () => {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([analyticsService.getSummary(), issueService.getIssues()]).then(
      ([analyticsData, issueList]) => {
        setSummary(analyticsData);
        setIssues(issueList);
        setLoading(false);
      }
    );
  }, []);

  if (loading || !summary) return <LoadingState message="Loading authority command center..." />;

  const criticalCount = issues.filter((i) => i.severity === 'Critical').length;
  const inProgressCount = issues.filter((i) => i.status === 'In Progress').length;
  const overdueCount = 14; // Demo metric
  const reopenedCount = issues.filter((i) => i.status === 'Reopened').length;

  const categoryChartData = Object.entries(summary.byCategory).map(([key, val]) => ({
    name: key.split(' ')[0], // short name
    fullCategory: key,
    count: val,
  }));

  const statusChartData = Object.entries(summary.byStatus).map(([key, val]) => ({
    name: key,
    value: val,
  }));

  const COLORS = ['#2563eb', '#0891b2', '#f59e0b', '#10b981', '#6366f1', '#f43f5e'];

  const trendData = [
    { day: 'Mon', reported: 42, resolved: 38 },
    { day: 'Tue', reported: 55, resolved: 49 },
    { day: 'Wed', reported: 68, resolved: 60 },
    { day: 'Thu', reported: 60, resolved: 58 },
    { day: 'Fri', reported: 75, resolved: 70 },
    { day: 'Sat', reported: 40, resolved: 45 },
    { day: 'Sun', reported: 30, resolved: 35 },
  ];

  const deptWorkloadData = [
    { department: 'Roads', open: 120, resolved: 430 },
    { department: 'Water', open: 50, resolved: 130 },
    { department: 'Sanitation', open: 40, resolved: 340 },
    { department: 'Electrical', open: 25, resolved: 215 },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-md">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded bg-indigo-800 text-indigo-200 border border-indigo-700">
              Ward Command Center
            </span>
            <DemoBadge label="Ward H/West (Bandra)" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">Municipal Authority Dashboard</h1>
          <p className="text-xs text-slate-300">
            Real-time complaint triage, departmental dispatches, SLA tracking, and resolution auditing.
          </p>
        </div>
      </div>

      {/* 8 StatCards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Complaints"
          value={summary.totalReported}
          subtitle="Cumulative citywide"
          icon={FileText}
          variant="default"
        />
        <StatCard
          title="Critical Severity"
          value={criticalCount}
          subtitle="Requires 2h SLA response"
          icon={AlertTriangle}
          variant="warning"
        />
        <StatCard
          title="Pending Triage"
          value={summary.totalPending}
          subtitle="Unassigned queue"
          icon={Clock}
          variant="accent"
        />
        <StatCard
          title="Work In Progress"
          value={inProgressCount}
          subtitle="Field squad dispatched"
          icon={TrendingUp}
          variant="accent"
        />
        <StatCard
          title="Overdue SLAs"
          value={overdueCount}
          subtitle="Escalated to Officers"
          icon={AlertTriangle}
          variant="warning"
        />
        <StatCard
          title="Resolved Tickets"
          value={summary.totalResolved}
          subtitle="Citizen verified"
          icon={CheckCircle2}
          variant="success"
        />
        <StatCard
          title="Reopened Complaints"
          value={reopenedCount}
          subtitle="Citizen rejected repair"
          icon={RotateCcw}
          variant="default"
        />
        <StatCard
          title="Duplicates Merged"
          value={summary.duplicatesMerged}
          subtitle="Geospatial AI merges"
          icon={GitMerge}
          variant="success"
        />
      </div>

      {/* Recharts Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Distribution Chart */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-700" /> Category Breakdown
            </h3>
            <DemoBadge label="Category Data" />
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip />
                <Bar dataKey="count" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Breakdown Pie Chart */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-700" /> Status Distribution
            </h3>
            <DemoBadge label="Status Data" />
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {statusChartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Weekly Trend Line Chart */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-700" /> Daily Intake vs Resolution Velocity
            </h3>
            <DemoBadge label="Weekly Trend" />
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="day" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip />
                <Line type="monotone" dataKey="reported" stroke="#ea580c" strokeWidth={2} name="Reported" />
                <Line type="monotone" dataKey="resolved" stroke="#10b981" strokeWidth={2} name="Resolved" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Department Workload Bar Chart */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-700" /> Department Workload Load
            </h3>
            <DemoBadge label="Department Data" />
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deptWorkloadData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="department" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip />
                <Bar dataKey="open" fill="#f59e0b" name="Open Backlog" radius={[4, 4, 0, 0]} />
                <Bar dataKey="resolved" fill="#10b981" name="Resolved" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Interactive Map Panel */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-blue-700" /> Ward Spatial Cluster Map
          </h2>
          <DemoBadge label="Ward H/West Map" />
        </div>
        <DemoMapPreview />
      </div>
    </div>
  );
};
