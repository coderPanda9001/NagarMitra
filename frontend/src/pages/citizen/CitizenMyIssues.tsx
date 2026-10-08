import React, { useEffect, useState } from 'react';
import { issueService } from '../../services/issueService';
import { Issue } from '../../types';
import { IssueCard } from '../../components/citizen/IssueCard';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingState } from '../../components/common/LoadingState';
import { DemoBadge } from '../../components/common/DemoBadge';
import { Search, Filter, FileText } from 'lucide-react';

export const CitizenMyIssues: React.FC = () => {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'All' | 'Active' | 'Resolved' | 'Reopened'>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  useEffect(() => {
    issueService.getIssues().then((data) => {
      setIssues(data);
      setLoading(false);
    });
  }, []);

  if (loading) return <LoadingState message="Fetching your reported issues..." />;

  const filteredIssues = issues.filter((iss) => {
    // Tab filter
    if (activeTab === 'Active') {
      if (['Resolved', 'Rejected', 'Duplicate'].includes(iss.status)) return false;
    } else if (activeTab === 'Resolved') {
      if (iss.status !== 'Resolved') return false;
    } else if (activeTab === 'Reopened') {
      if (iss.status !== 'Reopened') return false;
    }

    // Search term filter
    if (searchTerm) {
      const query = searchTerm.toLowerCase();
      const matchTitle = iss.report.title.toLowerCase().includes(query);
      const matchTracking = iss.trackingNumber.toLowerCase().includes(query);
      const matchLoc = iss.report.address.toLowerCase().includes(query);
      if (!matchTitle && !matchTracking && !matchLoc) return false;
    }

    // Category filter
    if (selectedCategory !== 'All' && iss.report.category !== selectedCategory) {
      return false;
    }

    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl font-bold text-slate-900">My Reported Issues</h1>
            <DemoBadge label="Citizen View" />
          </div>
          <p className="text-xs text-slate-500">
            Track status updates, worker dispatches, and audit resolution quality for your submitted complaints.
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex bg-slate-100 p-1 rounded-xl shrink-0 self-start md:self-auto text-xs font-semibold">
          {(['All', 'Active', 'Resolved', 'Reopened'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === tab
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Search & Category Filter Bar */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by issue title, tracking number (e.g. CT-2026), or street address..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-600"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-500" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-600"
          >
            <option value="All">All Categories</option>
            <option value="Roads & Potholes">Roads & Potholes</option>
            <option value="Water Supply & Leakage">Water Supply & Leakage</option>
            <option value="Garbage & Sanitation">Garbage & Sanitation</option>
            <option value="Street Lighting">Street Lighting</option>
            <option value="Drainage & Sewage">Drainage & Sewage</option>
          </select>
        </div>
      </div>

      {/* Issues List */}
      {filteredIssues.length > 0 ? (
        <div className="space-y-4">
          {filteredIssues.map((issue) => (
            <IssueCard key={issue.id} issue={issue} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={FileText}
          title="No complaints match your filters"
          description="Try selecting a different tab or clear search filters to view your submitted reports."
        />
      )}
    </div>
  );
};
