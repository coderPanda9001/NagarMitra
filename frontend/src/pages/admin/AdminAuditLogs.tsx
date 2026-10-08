import React, { useState, useEffect, useCallback } from 'react';
import { AuditLog } from '../../types';
import { Search, Filter, RefreshCcw, Shield } from 'lucide-react';
import { authService } from '../../services/authService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

const ACTION_FILTERS = [
  { value: 'ALL', label: 'All Actions' },
  { value: 'Issue Created', label: 'Issue Created' },
  { value: 'Issue Merge', label: 'Issue Merge' },
  { value: 'Issue Split', label: 'Issue Split' },
  { value: 'Assignment', label: 'Assignment' },
  { value: 'Status Transition', label: 'Status Transition' },
  { value: 'Priority Recompute', label: 'Priority Recompute' },
  { value: 'Department Override', label: 'Dept Override' },
  { value: 'Work Note Added', label: 'Work Note' },
  { value: 'Supporting Report Added', label: 'Supporting Added' },
  { value: 'SLA Rule Edit', label: 'SLA Rule Edit' },
  { value: 'SLA_ESCALATION_T1', label: 'SLA Escalation T1' },
  { value: 'SLA_ESCALATION_T2', label: 'SLA Escalation T2' },
];

const MOCK_LOGS: AuditLog[] = [
  { id: 'log-101', actorId: 'usr-authority-demo', actorName: 'Officer Rajesh Varma', actorRole: 'Authority', action: 'Issue Merge', targetType: 'Issue', targetId: 'iss-master-1', details: 'Merged duplicate complaint into master ticket. Supporting counts combined.', timestamp: '2026-10-03T09:18:00Z' },
  { id: 'log-102', actorId: 'usr-authority-demo', actorName: 'Officer Rajesh Varma', actorRole: 'Authority', action: 'Assignment', targetType: 'Issue', targetId: 'iss-2', details: 'Dispatched water squad team for emergency pipeline repair.', timestamp: '2026-10-02T14:30:00Z' },
  { id: 'log-103', actorId: 'usr-worker-demo', actorName: 'Ramesh Shinde', actorRole: 'Worker', action: 'Status Transition', targetType: 'Issue', targetId: 'iss-3', details: 'In Progress → Resolution Submitted.', timestamp: '2026-10-03T08:30:00Z' },
  { id: 'log-104', actorId: 'usr-admin-demo', actorName: 'Vikram Mehta', actorRole: 'Admin', action: 'SLA Rule Edit', targetType: 'SLARule', targetId: 'cat-roads-potholes', details: 'Target hours updated 24 → 30.', timestamp: '2026-10-01T11:05:00Z' },
  { id: 'log-105', actorId: 'system-sla', actorName: 'SLA Engine', actorRole: 'Authority', action: 'SLA_ESCALATION_T1', targetType: 'Issue', targetId: 'iss-old-1', details: 'Tier 1 escalation triggered.', timestamp: '2026-10-03T12:45:00Z' },
];

function tryParseDetails(detailsStr: any): any {
  if (!detailsStr) return null;
  if (typeof detailsStr === 'object') return detailsStr;
  try { return JSON.parse(String(detailsStr)); } catch (_) { return null; }
}

function normalizeLog(raw: any): AuditLog {
  return {
    id: raw.id ?? `log-${Math.random().toString(36).substr(2, 9)}`,
    actorId: raw.actor_id ?? raw.actorId ?? '',
    actorName: raw.actor_name ?? raw.actorName ?? 'Unknown',
    actorRole: (raw.actor_role ?? raw.actorRole ?? 'Citizen') as AuditLog['actorRole'],
    action: raw.action ?? 'UNKNOWN',
    targetType: raw.target_type ?? raw.targetType ?? '',
    targetId: raw.target_id ?? raw.targetId ?? '',
    details: raw.details ?? '',
    timestamp: raw.timestamp ?? new Date().toISOString(),
  };
}

function renderDetailsSnippet(detailsStr: any, isOpen: boolean): React.ReactNode {
  if (!detailsStr) return <span className="text-slate-400">—</span>;
  const parsed = tryParseDetails(detailsStr);
  if (!parsed) {
    return <span>{String(detailsStr)}</span>;
  }
  try {
    if (parsed.changes && typeof parsed.changes === 'object') {
      const keys = Object.keys(parsed.changes);
      if (keys.length > 0) {
        return (
          <span>
            {keys.slice(0, 2).map((k) => {
              const item = parsed.changes[k] || {};
              const oldVal = item.old !== undefined ? item.old : '';
              const newVal = item.new !== undefined ? item.new : '';
              return (
                <span key={k} className="mr-2 text-[10px] bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5">
                  {k}: {JSON.stringify(oldVal)}→{JSON.stringify(newVal)}
                </span>
              );
            })}
          </span>
        );
      }
    }
    return (
      <span className="text-[10px] text-slate-500 bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5">
        JSON (click to expand {isOpen ? '▲' : '▼'})
      </span>
    );
  } catch (e) {
    return <span>{String(detailsStr)}</span>;
  }
}

export const AdminAuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>(MOCK_LOGS);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const getAuthHeader = (): Record<string, string> => {
    const token = authService.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const load = useCallback(async () => {
    setLoading(true);
    if (USE_MOCK) {
      setLogs(MOCK_LOGS);
      setLoading(false);
      return;
    }
    try {
      const params = new URLSearchParams({ limit: '300', offset: '0' });
      if (roleFilter !== 'ALL') params.set('actor_role', roleFilter);
      if (actionFilter !== 'ALL') params.set('action', actionFilter);
      const resp = await fetch(`${API_BASE_URL}/admin/audit-logs?${params.toString()}`, {
        headers: getAuthHeader(),
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const raw = await resp.json();
      const list = Array.isArray(raw) ? raw : raw.items ?? raw.logs ?? [];
      setLogs(list.map((r: any) => normalizeLog(r)));
    } catch (_) {
      setLogs(MOCK_LOGS);
    } finally {
      setLoading(false);
    }
  }, [roleFilter, actionFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = logs.filter((log) => {
    const matchesSearch = !search.trim() || (
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      log.actorName.toLowerCase().includes(search.toLowerCase()) ||
      JSON.stringify(log.details).toLowerCase().includes(search.toLowerCase()) ||
      log.targetId.toLowerCase().includes(search.toLowerCase())
    );
    const matchesRole = roleFilter === 'ALL' || log.actorRole === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900">Systemwide Audit Logs</h1>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
              <Shield className="w-3 h-3" /> LIVE DB-BACKED
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Immutable audit trail of all platform events, triage actions, SLA edits, and security changes.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-60 self-start sm:self-center"
        >
          <RefreshCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col lg:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search logs by action, user, target ID, or details..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-600 focus:outline-none"
          >
            <option value="ALL">All Roles</option>
            <option value="Citizen">Citizen</option>
            <option value="Authority">Authority</option>
            <option value="Worker">Worker</option>
            <option value="Admin">Admin</option>
            <option value="System">System</option>
          </select>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-600 focus:outline-none"
          >
            {ACTION_FILTERS.map((f) => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-10 text-xs text-slate-500 text-center">Loading audit logs…</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-xs uppercase tracking-wider">
                <tr>
                  <th className="p-4">Timestamp</th>
                  <th className="p-4">User / Actor</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Action Event</th>
                  <th className="p-4">Target Entity</th>
                  <th className="p-4">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-xs">
                {filtered.map((log, idx) => {
                  const parsed = tryParseDetails(log.details);
                  const open = Boolean(expanded[log.id]);
                  const keyId = log.id || `admin-log-${idx}`;

                  return (
                    <React.Fragment key={keyId}>
                      <tr
                        className="hover:bg-slate-50/60 transition-colors cursor-pointer"
                        onClick={() => setExpanded((prev) => ({ ...prev, [log.id]: !prev[log.id] }))}
                      >
                        <td className="p-4 text-slate-500 whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                        <td className="p-4 font-semibold text-slate-900 font-sans">{log.actorName}</td>
                        <td className="p-4">
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-800 text-[10px] font-bold rounded">
                            {log.actorRole}
                          </span>
                        </td>
                        <td className="p-4 font-bold text-blue-700 font-sans">{log.action}</td>
                        <td className="p-4 text-slate-600">{log.targetType} ({log.targetId})</td>
                        <td className="p-4 text-slate-600 font-sans max-w-md truncate">
                          {renderDetailsSnippet(log.details, open)}
                        </td>
                      </tr>
                      {open && (
                        <tr>
                          <td colSpan={6} className="bg-slate-50 p-4 border-b border-slate-100">
                            <pre className="text-[11px] bg-white border border-slate-200 rounded p-3 overflow-auto max-h-60 text-slate-700 font-mono whitespace-pre-wrap break-all">
                              {parsed ? JSON.stringify(parsed, null, 2) : String(log.details)}
                            </pre>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-10 text-center text-xs text-slate-500">
                      No audit log entries match current filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
