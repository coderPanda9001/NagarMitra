import { AnalyticsSummary } from '../types';
import { authService } from './authService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

export interface IAnalyticsService {
  getSummary(): Promise<AnalyticsSummary>;
  getCategoryTrends(): Promise<{ category: string; count: number; resolved: number }[]>;
  getWardPerformance(): Promise<{ ward: string; reported: number; resolved: number; avgHours: number }[]>;
}

const DEMO_SUMMARY: AnalyticsSummary = {
  totalReported: 1482,
  totalResolved: 1195,
  totalPending: 287,
  duplicatesMerged: 312,
  avgResolutionHours: 28.4,
  citizenSatisfactionPercentage: 92.5,
  byCategory: {
    'Roads & Potholes': 520,
    'Garbage & Sanitation': 380,
    'Street Lighting': 240,
    'Water Supply & Leakage': 180,
    'Drainage & Sewage': 110,
    'Other': 52,
  },
  byWard: {
    'Ward H/West (Bandra)': 410,
    'Ward K/West (Andheri)': 390,
    'Ward A (Colaba)': 230,
    'Ward G/North (Dadar)': 270,
    'Ward D (Malabar Hill)': 182,
  },
  byStatus: {
    Reported: 45,
    'Under Review': 32,
    Confirmed: 20,
    Assigned: 54,
    'In Progress': 86,
    'Resolution Submitted': 50,
    Resolved: 1195,
  },
};

class HybridAnalyticsService implements IAnalyticsService {
  private getAuthHeader(): Record<string, string> {
    const token = authService.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  async getSummary(): Promise<AnalyticsSummary> {
    if (!USE_MOCK) {
      try {
        const response = await fetch(`${API_BASE_URL}/analytics/summary`, {
          headers: this.getAuthHeader(),
        });
        if (response.ok) {
          const raw = await response.json();
          return {
            totalReported: Number(raw.totalReported ?? raw.total_reported ?? 0),
            totalResolved: Number(raw.totalResolved ?? raw.total_resolved ?? 0),
            totalPending: Number(raw.totalPending ?? raw.total_pending ?? 0),
            duplicatesMerged: Number(raw.duplicatesMerged ?? raw.duplicates_merged ?? 0),
            avgResolutionHours: Number(raw.avgResolutionHours ?? raw.avg_resolution_hours ?? 0),
            citizenSatisfactionPercentage: Number(raw.citizenSatisfactionPct ?? raw.citizen_satisfaction_pct ?? raw.citizenSatisfactionPercentage ?? 0),
            byCategory: raw.byCategory ?? raw.by_category ?? {},
            byWard: raw.byWard ?? raw.by_ward ?? {},
            byStatus: raw.byStatus ?? raw.by_status ?? {},
          };
        }
      } catch (err) {
        // Fallback to mock
      }
    }
    return DEMO_SUMMARY;
  }

  async getCategoryTrends(): Promise<{ category: string; count: number; resolved: number }[]> {
    if (!USE_MOCK) {
      try {
        const days = 30;
        const response = await fetch(`${API_BASE_URL}/analytics/trends?days=${days}`, {
          headers: this.getAuthHeader(),
        });
        if (response.ok) {
          const raw = await response.json();
          const byCat: Record<string, { count: number; resolved: number }> = {};
          const list: any[] = Array.isArray(raw) ? raw : raw.trends ?? raw.daily ?? [];
          for (const row of list) {
            const cat = row.category ?? row.category_id ?? 'Other';
            const isResolved = ['Verified', 'Resolved', 'Closed'].includes(String(row.status ?? ''));
            const bucket = byCat[cat] ?? { count: 0, resolved: 0 };
            bucket.count += 1;
            if (isResolved) bucket.resolved += 1;
            byCat[cat] = bucket;
          }
          const summaryResp = await fetch(`${API_BASE_URL}/analytics/summary`, {
            headers: this.getAuthHeader(),
          });
          if (summaryResp.ok) {
            const s = await summaryResp.json();
            const bc = s.byCategory ?? s.by_category ?? {};
            for (const key of Object.keys(bc)) {
              if (!byCat[key]) byCat[key] = { count: 0, resolved: 0 };
              byCat[key].count = Math.max(byCat[key].count, Number(bc[key] ?? 0));
            }
          }
          return Object.keys(byCat).map((k) => ({
            category: k,
            count: byCat[k].count,
            resolved: byCat[k].resolved,
          }));
        }
      } catch (err) {
        // Fallback
      }
    }
    return [
      { category: 'Roads & Potholes', count: 520, resolved: 430 },
      { category: 'Garbage & Sanitation', count: 380, resolved: 340 },
      { category: 'Street Lighting', count: 240, resolved: 215 },
      { category: 'Water Supply & Leakage', count: 180, resolved: 130 },
      { category: 'Drainage & Sewage', count: 110, resolved: 80 },
    ];
  }

  async getWardPerformance(): Promise<{ ward: string; reported: number; resolved: number; avgHours: number }[]> {
    if (!USE_MOCK) {
      try {
        const response = await fetch(`${API_BASE_URL}/analytics/workload`, {
          headers: this.getAuthHeader(),
        });
        if (response.ok) {
          const raw = await response.json();
          const list: any[] = Array.isArray(raw) ? raw : raw.departments ?? raw.by_department ?? [];
          const byWard: Record<string, { reported: number; resolved: number; avgHours: number; weights: number }> = {};
          for (const row of list) {
            const w = row.ward ?? row.name ?? row.department ?? 'Unknown';
            const bucket = byWard[w] ?? { reported: 0, resolved: 0, avgHours: 0, weights: 0 };
            const open = Number(row.open_issues ?? row.open ?? row.count ?? 0);
            const closed = Number(row.closed_issues ?? row.resolved ?? 0);
            const avgH = Number(row.avg_resolution_hours ?? row.avgHours ?? 24);
            bucket.reported += open + closed;
            bucket.resolved += closed;
            if (avgH > 0 && (open + closed) > 0) {
              bucket.avgHours = (bucket.avgHours * bucket.weights + avgH * (open + closed)) / (bucket.weights + open + closed);
              bucket.weights += open + closed;
            }
            byWard[w] = bucket;
          }
          const summaryResp = await fetch(`${API_BASE_URL}/analytics/summary`, {
            headers: this.getAuthHeader(),
          });
          if (summaryResp.ok) {
            const s = await summaryResp.json();
            const bw = s.byWard ?? s.by_ward ?? {};
            for (const key of Object.keys(bw)) {
              if (!byWard[key]) byWard[key] = { reported: 0, resolved: 0, avgHours: 24, weights: 0 };
              byWard[key].reported = Math.max(byWard[key].reported, Number(bw[key] ?? 0));
            }
          }
          return Object.keys(byWard).map((k) => ({
            ward: k,
            reported: byWard[k].reported,
            resolved: byWard[k].resolved,
            avgHours: byWard[k].avgHours || 24,
          }));
        }
      } catch (err) {
        // Fallback
      }
    }
    return [
      { ward: 'Ward H/West (Bandra)', reported: 410, resolved: 360, avgHours: 24.2 },
      { ward: 'Ward K/West (Andheri)', reported: 390, resolved: 310, avgHours: 32.5 },
      { ward: 'Ward A (Colaba)', reported: 230, resolved: 205, avgHours: 19.8 },
      { ward: 'Ward G/North (Dadar)', reported: 270, resolved: 220, avgHours: 26.0 },
      { ward: 'Ward D (Malabar Hill)', reported: 182, resolved: 165, avgHours: 18.5 },
    ];
  }
}

export const analyticsService = new HybridAnalyticsService();
