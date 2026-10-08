import React from 'react';
import { DemoBadge } from '../../components/common/DemoBadge';
import { Activity, Server, Database, Sparkles, Mic, MapPin, ShieldCheck, RefreshCw } from 'lucide-react';

export const AdminSystemHealth: React.FC = () => {
  const services = [
    {
      name: 'API Gateway & Auth Service',
      status: 'Healthy',
      latency: '24 ms',
      uptime: '99.98%',
      icon: Server,
    },
    {
      name: 'Database Cluster (SQLAlchemy / SQLite)',
      status: 'Healthy',
      latency: '12 ms',
      uptime: '100%',
      icon: Database,
    },
    {
      name: 'AI Issue Categorization Engine',
      status: 'Healthy',
      latency: '140 ms',
      uptime: '99.92%',
      icon: Sparkles,
    },
    {
      name: 'AI Duplicate Detection & Merging',
      status: 'Healthy',
      latency: '210 ms',
      uptime: '99.85%',
      icon: ShieldCheck,
    },
    {
      name: 'Speech-to-Text Voice Transcription',
      status: 'Healthy (Demo mode)',
      latency: '85 ms',
      uptime: '99.90%',
      icon: Mic,
    },
    {
      name: 'Spatial GIS & Clustering Engine',
      status: 'Healthy',
      latency: '45 ms',
      uptime: '100%',
      icon: MapPin,
    },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900">System Health & Infrastructure</h1>
            <DemoBadge />
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Real-time operational status of backend services, microservices, and AI models
          </p>
        </div>
        <button
          type="button"
          onClick={() => alert('Demo: Service health check refreshed.')}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold shadow flex items-center gap-2 self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh Status
        </button>
      </div>

      {/* Demo Status Note Banner */}
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between text-amber-900">
        <div className="flex items-center gap-3">
          <Activity className="w-5 h-5 text-amber-600 shrink-0" />
          <div className="text-xs">
            <strong>Demo status note:</strong> Metrics below reflect active simulated telemetry. Real live production telemetry will connect when backend FastAPI services are deployed.
          </div>
        </div>
        <span className="px-2.5 py-1 bg-amber-200/80 text-amber-900 text-[11px] font-bold rounded-lg shrink-0">
          Demo Telemetry
        </span>
      </div>

      {/* Service Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((s, idx) => (
          <div
            key={idx}
            className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4 hover:border-blue-300 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-50 text-blue-700 rounded-xl border border-blue-100">
                  <s.icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{s.name}</h3>
                  <span className="text-[10px] text-slate-400 font-mono">Demo Service</span>
                </div>
              </div>
              <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-[11px] font-bold rounded-full">
                {s.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100">
              <div className="p-2 bg-slate-50 rounded-lg">
                <div className="text-slate-500 text-[11px]">Latency</div>
                <div className="font-semibold text-slate-800">{s.latency}</div>
              </div>
              <div className="p-2 bg-slate-50 rounded-lg">
                <div className="text-slate-500 text-[11px]">Uptime (30d)</div>
                <div className="font-semibold text-slate-800">{s.uptime}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
