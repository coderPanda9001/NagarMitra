import React, { useState, useEffect, useCallback } from 'react';
import { Clock, Shield, Save, Check, AlertTriangle, RefreshCcw } from 'lucide-react';
import { authService } from '../../services/authService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

interface SLARule {
  id: string;
  categoryId: string;
  categoryName?: string;
  targetHours: number;
  atRiskPct: number;
  overduePct: number;
  breachedPct: number;
  escalation1Hours: number;
  escalation2Hours: number;
}

const MOCK_RULES: SLARule[] = [
  { id: 'mock-1', categoryId: 'cat-roads-potholes', categoryName: 'Roads & Potholes', targetHours: 24, atRiskPct: 0.6, overduePct: 1.0, breachedPct: 1.2, escalation1Hours: 12, escalation2Hours: 22 },
  { id: 'mock-2', categoryId: 'cat-water-leak', categoryName: 'Water Pipeline Leak', targetHours: 12, atRiskPct: 0.6, overduePct: 1.0, breachedPct: 1.2, escalation1Hours: 6, escalation2Hours: 11 },
  { id: 'mock-3', categoryId: 'cat-san-garbage', categoryName: 'Garbage Not Collected', targetHours: 18, atRiskPct: 0.6, overduePct: 1.0, breachedPct: 1.2, escalation1Hours: 9, escalation2Hours: 16 },
  { id: 'mock-4', categoryId: 'cat-streetlight', categoryName: 'Street Light Not Working', targetHours: 24, atRiskPct: 0.6, overduePct: 1.0, breachedPct: 1.2, escalation1Hours: 12, escalation2Hours: 22 },
  { id: 'mock-5', categoryId: 'cat-traffic-signal', categoryName: 'Traffic Signal Fault', targetHours: 4, atRiskPct: 0.6, overduePct: 1.0, breachedPct: 1.2, escalation1Hours: 2, escalation2Hours: 4 },
  { id: 'mock-6', categoryId: 'cat-tree-fallen', categoryName: 'Fallen Tree / Branch', targetHours: 6, atRiskPct: 0.6, overduePct: 1.0, breachedPct: 1.2, escalation1Hours: 3, escalation2Hours: 5 },
];

export const AdminSLA: React.FC = () => {
  const [rules, setRules] = useState<SLARule[]>([]);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const getAuthHeader = (): Record<string, string> => {
    const token = authService.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const normalizeRule = (r: any): SLARule => ({
    id: r.id ?? '',
    categoryId: r.category_id ?? r.categoryId ?? '',
    categoryName: r.category_name ?? r.categoryName ?? r.category_id ?? '',
    targetHours: Number(r.target_hours ?? r.targetHours ?? 24),
    atRiskPct: Number(r.at_risk_pct ?? r.atRiskPct ?? 0.6),
    overduePct: Number(r.overdue_pct ?? r.overduePct ?? 1.0),
    breachedPct: Number(r.breached_pct ?? r.breachedPct ?? 1.2),
    escalation1Hours: Number(r.escalation1_hours ?? r.escalation1Hours ?? Math.round((r.target_hours ?? 24) * 0.5)),
    escalation2Hours: Number(r.escalation2_hours ?? r.escalation2Hours ?? Math.round((r.target_hours ?? 24) * 0.9)),
  });

  const loadRules = useCallback(async () => {
    setLoading(true);
    setError(null);
    if (USE_MOCK) {
      setRules(MOCK_RULES);
      setLoading(false);
      return;
    }
    try {
      const resp = await fetch(`${API_BASE_URL}/admin/sla-rules`, {
        headers: getAuthHeader(),
      });
      if (!resp.ok) {
        throw new Error(`HTTP ${resp.status}`);
      }
      const data = await resp.json();
      const list = Array.isArray(data) ? data : data.rules ?? [];
      setRules(list.map((r: any) => normalizeRule(r)));
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load SLA rules.');
      setRules(MOCK_RULES);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRules();
  }, [loadRules]);

  const updateTargetHours = (id: string, value: number) => {
    setRules((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              targetHours: value,
              escalation1Hours: Math.max(1, Math.round(value * 0.5)),
              escalation2Hours: Math.max(1, Math.round(value * 0.9)),
            }
          : r,
      ),
    );
    if (savedId === id) setSavedId(null);
  };

  const saveRule = async (rule: SLARule) => {
    setSavingId(rule.id);
    setError(null);
    try {
      if (USE_MOCK) {
        await new Promise((r) => setTimeout(r, 350));
        setSavedId(rule.id);
        setTimeout(() => setSavedId((curr) => (curr === rule.id ? null : curr)), 2500);
        return;
      }
      const body = {
        target_hours: rule.targetHours,
        at_risk_pct: rule.atRiskPct,
        overdue_pct: rule.overduePct,
        breached_pct: rule.breachedPct,
        escalation1_hours: rule.escalation1Hours,
        escalation2_hours: rule.escalation2Hours,
      };
      const resp = await fetch(`${API_BASE_URL}/admin/sla-rules/${encodeURIComponent(rule.categoryId)}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
        body: JSON.stringify(body),
      });
      if (!resp.ok) {
        const text = await resp.text().catch(() => '');
        throw new Error(resp.status === 403 ? 'Permission denied: Admin role required.' : `HTTP ${resp.status} ${text}`);
      }
      const saved = await resp.json();
      setRules((prev) => prev.map((r) => (r.id === rule.id ? normalizeRule(saved) : r)));
      setSavedId(rule.id);
      setTimeout(() => setSavedId((curr) => (curr === rule.id ? null : curr)), 2500);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to save.');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900">SLA & Escalation Rules</h1>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
              <Check className="w-3 h-3" /> LIVE DB-BACKED
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Per-category SLA rules. Changes are written to the database and audited. At Risk = 60%, Overdue = 100%, Breached = 120%.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void loadRules()}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
        >
          <RefreshCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold rounded-xl flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {savedId && !error && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>SLA rule saved. Thresholds will apply to new & existing assignments immediately.</span>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center gap-2">
          <Clock className="w-5 h-5 text-blue-700" />
          <h2 className="text-base font-bold text-slate-900">Target Resolution Hours & Escalation Tiers</h2>
        </div>

        {loading ? (
          <div className="p-10 text-xs text-slate-500 text-center">Loading SLA rules…</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                <tr>
                  <th className="p-3">Category</th>
                  <th className="p-3">Target (h)</th>
                  <th className="p-3">At Risk (60%)</th>
                  <th className="p-3">Overdue (100%)</th>
                  <th className="p-3">Breached (120%)</th>
                  <th className="p-3">
                    <Shield className="w-3.5 h-3.5 inline mr-1" />
                    Esc. T1
                  </th>
                  <th className="p-3">
                    <Shield className="w-3.5 h-3.5 inline mr-1" />
                    Esc. T2
                  </th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rules.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="p-3 font-semibold text-slate-900">{r.categoryName ?? r.categoryId}</td>
                    <td className="p-3 w-28">
                      <input
                        type="number"
                        min={1}
                        max={720}
                        value={r.targetHours}
                        onChange={(e) => updateTargetHours(r.id, Math.max(1, Number(e.target.value) || 1))}
                        className="w-full px-2 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-blue-600 focus:outline-none"
                      />
                    </td>
                    <td className="p-3 text-amber-700 font-mono">{(r.targetHours * r.atRiskPct).toFixed(1)}h</td>
                    <td className="p-3 text-orange-700 font-mono">{(r.targetHours * r.overduePct).toFixed(1)}h</td>
                    <td className="p-3 text-rose-700 font-mono font-bold">{(r.targetHours * r.breachedPct).toFixed(1)}h</td>
                    <td className="p-3 text-indigo-700 font-mono">{r.escalation1Hours}h → Authority</td>
                    <td className="p-3 text-rose-700 font-mono">{r.escalation2Hours}h → Admin</td>
                    <td className="p-3 text-right">
                      <button
                        type="button"
                        onClick={() => void saveRule(r)}
                        disabled={savingId === r.id}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-[11px] font-bold shadow-sm disabled:opacity-60"
                      >
                        {savingId === r.id ? (
                          <RefreshCcw className="w-3 h-3 animate-spin" />
                        ) : savedId === r.id ? (
                          <Check className="w-3 h-3" />
                        ) : (
                          <Save className="w-3 h-3" />
                        )}
                        {savingId === r.id ? 'Saving…' : savedId === r.id ? 'Saved' : 'Save'}
                      </button>
                    </td>
                  </tr>
                ))}
                {rules.length === 0 && (
                  <tr>
                    <td colSpan={8} className="p-10 text-center text-xs text-slate-500">
                      No SLA rules loaded.
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
