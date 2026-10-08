import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { issueService } from '../../services/issueService';
import { Issue } from '../../types';
import { IssueStatusBadge } from '../../components/common/IssueStatusBadge';
import { SeverityBadge } from '../../components/common/SeverityBadge';
import { DemoBadge } from '../../components/common/DemoBadge';
import { LoadingState } from '../../components/common/LoadingState';
import { Search, Eye } from 'lucide-react';

export const AuthorityAllIssues: React.FC = () => {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [severityFilter, setSeverityFilter] = useState('All');
  const [wardFilter, setWardFilter] = useState('All');

  useEffect(() => {
    issueService.getIssues().then((data) => {
      setIssues(data);
      setLoading(false);
    });
  }, []);

  if (loading) return <LoadingState message="Fetching all municipal issues..." />;

  const filtered = issues.filter((i) => {
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matchTitle = i.report.title.toLowerCase().includes(q);
      const matchTrack = i.trackingNumber.toLowerCase().includes(q);
      const matchAddr = i.report.address.toLowerCase().includes(q);
      if (!matchTitle && !matchTrack && !matchAddr) return false;
    }
    if (categoryFilter !== 'All' && i.report.category !== categoryFilter) return false;
    if (statusFilter !== 'All' && i.status !== statusFilter) return false;
    if (severityFilter !== 'All' && i.severity !== severityFilter) return false;
    if (wardFilter !== 'All' && i.report.ward !== wardFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl font-bold text-slate-900">All Municipal Complaints</h1>
            <DemoBadge label="Master Index" />
          </div>
          <p className="text-xs text-slate-500">
            Searchable and filterable master registry of all reported municipal grievances across wards.
          </p>
        </div>
      </div>

      {/* Filter Controls Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by title, tracking ID (e.g. CT-2026), or address..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-600"
          />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Category</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-lg bg-white"
            >
              <option value="All">All Categories</option>
              <option value="Roads & Potholes">Roads & Potholes</option>
              <option value="Water Supply & Leakage">Water Supply & Leakage</option>
              <option value="Garbage & Sanitation">Garbage & Sanitation</option>
              <option value="Street Lighting">Street Lighting</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-lg bg-white"
            >
              <option value="All">All Statuses</option>
              <option value="Reported">Reported</option>
              <option value="Assigned">Assigned</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolution Submitted">Resolution Submitted</option>
              <option value="Resolved">Resolved</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Severity</label>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-lg bg-white"
            >
              <option value="All">All Severities</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Ward</label>
            <select
              value={wardFilter}
              onChange={(e) => setWardFilter(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-lg bg-white"
            >
              <option value="All">All Wards</option>
              <option value="Ward H/West (Bandra)">Ward H/West (Bandra)</option>
              <option value="Ward K/West (Andheri)">Ward K/West (Andheri)</option>
              <option value="Ward A (Colaba)">Ward A (Colaba)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Master Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
              <tr>
                <th className="p-3">Tracking ID</th>
                <th className="p-3">Title & Address</th>
                <th className="p-3">Category</th>
                <th className="p-3">Severity</th>
                <th className="p-3">Status</th>
                <th className="p-3">Reported At</th>
                <th className="p-3 text-right">View Master</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((i) => (
                <tr key={i.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-3 font-mono font-bold text-blue-700">
                    <Link to={`/authority/master/${i.id}`}>{i.trackingNumber}</Link>
                  </td>
                  <td className="p-3">
                    <div>
                      <p className="font-bold text-slate-900">{i.report.title}</p>
                      <span className="text-[11px] text-slate-500">{i.report.address}</span>
                    </div>
                  </td>
                  <td className="p-3 font-medium text-slate-800">{i.report.category}</td>
                  <td className="p-3">
                    <SeverityBadge severity={i.severity} size="sm" />
                  </td>
                  <td className="p-3">
                    <IssueStatusBadge status={i.status} size="sm" />
                  </td>
                  <td className="p-3 text-slate-500 font-mono">
                    {new Date(i.createdAt).toLocaleDateString()}
                  </td>
                  <td className="p-3 text-right">
                    <Link
                      to={`/authority/master/${i.id}`}
                      className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs rounded-lg inline-flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" /> Details
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
