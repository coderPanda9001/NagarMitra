import React, { useEffect, useState } from 'react';
import { issueService } from '../../services/issueService';
import { Issue } from '../../types';
import { DemoMapPreview } from '../../components/map/DemoMapPreview';
import { IssueStatusBadge } from '../../components/common/IssueStatusBadge';
import { SeverityBadge } from '../../components/common/SeverityBadge';
import { DemoBadge } from '../../components/common/DemoBadge';
import { LoadingState } from '../../components/common/LoadingState';
import { ThumbsUp, Filter, Check } from 'lucide-react';

export const CitizenNearbyIssues: React.FC = () => {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [radiusFilter, setRadiusFilter] = useState('2');
  const [affectedStatus, setAffectedStatus] = useState<Record<string, boolean>>({});

  useEffect(() => {
    issueService.getIssues().then((data) => {
      setIssues(data);
      setLoading(false);
    });
  }, []);

  if (loading) return <LoadingState message="Scanning nearby civic complaints..." />;

  const handleAlsoAffected = (issueId: string) => {
    setAffectedStatus((prev) => ({
      ...prev,
      [issueId]: true,
    }));
  };

  const filteredIssues = issues.filter((i) => {
    if (categoryFilter !== 'All' && i.report.category !== categoryFilter) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl font-bold text-slate-900">Nearby Civic Issues</h1>
            <DemoBadge label="GPS Radius Scan" />
          </div>
          <p className="text-xs text-slate-500">
            View grievances reported by neighboring residents within your locality. Upvote issues to signal urgency to ward authorities.
          </p>
        </div>

        {/* Radius & Category Selectors */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={radiusFilter}
              onChange={(e) => setRadiusFilter(e.target.value)}
              className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-600"
            >
              <option value="1">Within 1 km</option>
              <option value="2">Within 2 km</option>
              <option value="5">Within 5 km</option>
            </select>
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-600"
          >
            <option value="All">All Categories</option>
            <option value="Roads & Potholes">Roads & Potholes</option>
            <option value="Water Supply & Leakage">Water Supply & Leakage</option>
            <option value="Garbage & Sanitation">Garbage & Sanitation</option>
            <option value="Street Lighting">Street Lighting</option>
          </select>
        </div>
      </div>

      {/* Map Section */}
      <DemoMapPreview />

      {/* Nearby Complaints List */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-slate-900">
          Complaints near Ward H/West ({filteredIssues.length} found)
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredIssues.map((iss, index) => {
            const isAffected = affectedStatus[iss.id];
            const simulatedDistance = ((index + 1) * 0.35).toFixed(2);

            return (
              <div
                key={iss.id}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between space-y-4 hover:shadow-md transition-all"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-mono text-slate-400 font-semibold">
                      {iss.trackingNumber}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-50 text-blue-700 rounded border border-blue-200">
                        {simulatedDistance} km away
                      </span>
                      <IssueStatusBadge status={iss.status} size="sm" />
                    </div>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 leading-snug">{iss.report.title}</h3>
                  <p className="text-xs text-slate-600 line-clamp-2">{iss.report.description}</p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <SeverityBadge severity={iss.severity} size="sm" />
                    <span className="text-[11px] text-slate-500 font-medium truncate max-w-[140px]">
                      {iss.report.address}
                    </span>
                  </div>

                  <button
                    onClick={() => handleAlsoAffected(iss.id)}
                    disabled={isAffected}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 shrink-0 ${
                      isAffected
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                        : 'bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200'
                    }`}
                  >
                    {isAffected ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" /> Supported
                      </>
                    ) : (
                      <>
                        <ThumbsUp className="w-3.5 h-3.5 text-blue-600" /> I'm Also Affected
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
