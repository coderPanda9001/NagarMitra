import React, { useEffect, useState } from 'react';
import { analyticsService } from '../../services/analyticsService';
import { AnalyticsSummary } from '../../types';
import { DemoBadge } from '../../components/common/DemoBadge';
import { LoadingState } from '../../components/common/LoadingState';
import { StatCard } from '../../components/common/StatCard';
import { BarChart3, TrendingUp, ShieldCheck, Clock, Award } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

export const AuthorityAnalytics: React.FC = () => {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analyticsService.getSummary().then((data) => {
      setSummary(data);
      setLoading(false);
    });
  }, []);

  if (loading || !summary) return <LoadingState message="Compiling municipal ward analytics..." />;

  const wardPerfData = [
    { ward: 'Ward H/West', reported: 410, resolved: 360, avgHours: 24.2 },
    { ward: 'Ward K/West', reported: 390, resolved: 310, avgHours: 32.5 },
    { ward: 'Ward A', reported: 230, resolved: 205, avgHours: 19.8 },
    { ward: 'Ward G/North', reported: 270, resolved: 220, avgHours: 26.0 },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl font-bold text-slate-900">Ward Performance & SLA Analytics</h1>
            <DemoBadge label="Analytics Report" />
          </div>
          <p className="text-xs text-slate-500">
            Comparative analysis of ward resolution speeds, citizen audit satisfaction rates, and bottleneck categories.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Citizen Satisfaction"
          value={`${summary.citizenSatisfactionPercentage}%`}
          subtitle="Audit approval rate"
          icon={Award}
          variant="success"
        />
        <StatCard
          title="Avg Resolution Speed"
          value={`${summary.avgResolutionHours} hrs`}
          subtitle="Target SLA < 48h"
          icon={Clock}
          variant="accent"
        />
        <StatCard
          title="Geospatial Merges"
          value={summary.duplicatesMerged}
          subtitle="Duplicate tickets merged"
          icon={ShieldCheck}
          variant="default"
        />
        <StatCard
          title="Total Resolution Rate"
          value={`${Math.round((summary.totalResolved / summary.totalReported) * 100)}%`}
          subtitle="Closure efficiency"
          icon={TrendingUp}
          variant="success"
        />
      </div>

      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-blue-700" /> Ward Resolution Speed Comparison (Avg Hours)
        </h3>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={wardPerfData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="ward" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} />
              <Tooltip />
              <Bar dataKey="avgHours" fill="#0284c7" name="Avg Resolution Time (Hours)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
