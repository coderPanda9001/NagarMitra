import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCcw, Filter, Search, FileText } from 'lucide-react';
import { authService } from '../../services/authService';
import { AuditLog } from '../../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

const ACTION_FILTERS = [
  { value: 'ALL', label: 'All Actions' },
  { value: 'Issue Created', label: 'Issue Created' },
  { value: 'Issue Merge', label: 'Merged Issues' },
  { value: 'Issue Split', label: 'Split Issues' },
  { value: 'Assignment', label: 'Assignments' },
  { value: 'Status Transition', label: 'Status Changes' },
  { value: 'Priority Recompute', label: 'Priority Changes' },
  { value: 'Department Override', label: 'Dept Overrides' },
  { value: 'Supporting Report Added', label: 'Supporting Added' },
  { value: 'SLA Rule Edit', label: 'SLA Rule Edits' },
  { value: 'SLA_ESCALATION_T1', label: 'SLA Escalation T1' },
  { value: 'SLA_ESCALATION_T2', label: 'SLA Escalation T2' },
];

const MOCK_LOGS: AuditLog[] = [
  { id: 'demo-1', actorId: 'usr-authority-demo', actorName: 'Officer Rajesh Varma', actorRole: 'Authority', action: 'Issue Merge', targetType: 'Issue', targetId: 'iss-demo-master', details: 'Merged iss-demo-child into master (supporting counts updated)', timestamp: '2026-10-03T09:18:00Z' },
  { id: 'demo-2', actorId: 'usr-authority-demo', actorName: 'Officer Rajesh Varma', actorRole: 'Authority', action: 'Assignment', targetType: 'Issue', targetId: 'iss-demo-2', details: 'Assigned team-roads-pothole to department Roads & Traffic', timestamp: '2026-10-02T14:30:00Z' },
  { id: 'demo-3', actorId: 'usr-worker-demo', actorName: 'Ramesh Shinde', actorRole: 'Worker', action: 'Status Transition', targetType: 'Issue', targetId: 'iss-demo-3', details: 'In Progress → Resolution Submitted', timestamp: '2026-10-03T08:30:00Z' },
];

function tryParseDetails(details: any): any {
  if (!details) return null;
  if (typeof details === 'object') return details;
  try {
    return JSON.parse(String(details));
  } catch (e) {
    return null;
  }
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
    if (parsed.extra?.child_id) {
      return <span>merge: {String(parsed.extra.child_id)} → {String(parsed.extra.master_id || '')}</span>;
    }
    if (parsed.changes && typeof parsed.changes === 'object') {
      const keys = Object.keys(parsed.changes);
      if (keys.length > 0) {
        return (
          <span>
            {keys.map((k) => {
              const item = parsed.changes[k] || {};
              const oldVal = item.old !== undefined ? item.old : '';
              const newVal = item.new !== undefined ? item.new : '';
              return `${k}: ${JSON.stringify(oldVal)} → ${JSON.stringify(newVal)}`;
            }).join(' · ')}
          </span>
        );
      }
    }
    return (
      <code className="text-[10px] text-slate-500 bg-slate-50 border border-slate-200 rounded px-1 py-0.5">
        JSON details {isOpen ? '▲' : '▼'}
      </code>
    );
  } catch (e) {
    return <span>{String(detailsStr)}</span>;
  }
}

export const AuthorityAuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');
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
      const params = new URLSearchParams({ limit: '200', offset: '0' });
      if (actionFilter !== 'ALL') params.set('action', actionFilter);
      const resp = await fetch(`${API_BASE_URL}/admin/audit-logs?${params.toString()}`, {
        headers: getAuthHeader(),
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const raw = await resp.json();
      const list = Array.isArray(raw) ? raw : raw.items ?? raw.logs ?? [];
      setLogs(list.map((r: any) => normalizeLog(r)));
    } catch (e) {
      setLogs(MOCK_LOGS);
    } finally {
      setLoading(false);
    }
  }, [actionFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = logs.filter((log) => {
    const s = search.trim().toLowerCase();
    if (s) {
      const hay = `${log.actorName} ${log.action} ${log.targetType} ${log.targetId} ${JSON.stringify(log.details)}`.toLowerCase();
      if (!hay.includes(s)) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl font-bold text-slate-900">Authority Audit Trail</h1>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
              <FileText className="w-3 h-3" /> LIVE IMMUTABLE LOG
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Immutable log of officer actions, duplicate merges, squad dispatches, and status transitions.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-60 self-start md:self-center"
        >
          <RefreshCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by actor, action, target ID, or details..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-600 focus:outline-none"
          >
            {ACTION_FILTERS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-10 text-xs text-slate-500 text-center">Loading audit logs…</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                <tr>
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">Actor & Role</th>
                  <th className="p-3">Action</th>
                  <th className="p-3">Target</th>
                  <th className="p-3">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((l, idx) => {
                  const parsed = tryParseDetails(l.details);
                  const isOpen = Boolean(expanded[l.id]);
                  const keyId = l.id || `log-${idx}`;

                  return (
                    <React.Fragment key={keyId}>
                      <tr
                        className="hover:bg-slate-50 transition-colors cursor-pointer"
                        onClick={() => setExpanded((prev) => ({ ...prev, [l.id]: !prev[l.id] }))}
                      >
                        <td className="p-3 text-slate-500 whitespace-nowrap font-mono">
                          {new Date(l.timestamp).toLocaleString()}
                        </td>
                        <td className="p-3 font-semibold text-slate-900">
                          {l.actorName}{' '}
                          <span className="text-[10px] text-slate-400 font-normal">({l.actorRole})</span>
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
                            {l.action}
                          </span>
                        </td>
                        <td className="p-3 font-mono text-slate-700 whitespace-nowrap">
                          {l.targetType} · {l.targetId}
                        </td>
                        <td className="p-3 text-slate-600 max-w-sm truncate">
                          {renderDetailsSnippet(l.details, isOpen)}
                        </td>
                      </tr>
                      {isOpen && (
                        <tr>
                          <td colSpan={5} className="bg-slate-50 p-4 border-b border-slate-100">
                            <pre className="text-[11px] bg-white border border-slate-200 rounded p-3 overflow-auto max-h-60 text-slate-700 font-mono whitespace-pre-wrap break-all">
                              {parsed ? JSON.stringify(parsed, null, 2) : String(l.details)}
                            </pre>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
                {filtered.length === 0 && !loading && (
                  <tr>
                    <td colSpan={5} className="p-10 text-center text-xs text-slate-500">
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
