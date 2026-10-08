import React from 'react';
import { DemoBadge } from '../../components/common/DemoBadge';
import { Plus } from 'lucide-react';

export const AdminDepartments: React.FC = () => {
  const departments = [
    {
      id: 'dept-roads',
      name: 'Roads & Traffic Infrastructure',
      code: 'RTI',
      head: 'Rajesh Kulkarni (Executive Engineer)',
      teams: 8,
      activeIssues: 34,
      slaRate: '94%',
    },
    {
      id: 'dept-sanitation',
      name: 'Solid Waste Management & Sanitation',
      code: 'SWM',
      head: 'Sanjay Deshmukh (Chief Officer)',
      teams: 12,
      activeIssues: 28,
      slaRate: '91%',
    },
    {
      id: 'dept-water',
      name: 'Water Supply & Sewerage Disposal',
      code: 'WSD',
      head: 'Anil Patil (Superintending Engineer)',
      teams: 6,
      activeIssues: 19,
      slaRate: '88%',
    },
    {
      id: 'dept-power',
      name: 'Street Lighting & Power Grid',
      code: 'SLP',
      head: 'Sunil Jadhav (Senior Inspector)',
      teams: 5,
      activeIssues: 14,
      slaRate: '97%',
    },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900">Municipal Departments</h1>
            <DemoBadge />
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Configure municipal ward wings, executive heads, and field squad rosters
          </p>
        </div>
        <button
          type="button"
          onClick={() => alert('Demo: Add department form is available in administrative setup.')}
          className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-semibold shadow flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Add Department
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {departments.map((d) => (
          <div
            key={d.id}
            className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4 hover:border-blue-300 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-50 text-blue-700 rounded-xl border border-blue-100 font-bold text-sm">
                  {d.code}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">{d.name}</h3>
                  <div className="text-xs text-slate-500 mt-0.5">Head: {d.head}</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 pt-3 border-t border-slate-100 text-center text-xs">
              <div className="p-2.5 bg-slate-50 rounded-xl">
                <div className="font-bold text-slate-900 text-sm">{d.teams}</div>
                <div className="text-slate-500">Squads</div>
              </div>
              <div className="p-2.5 bg-amber-50 rounded-xl">
                <div className="font-bold text-amber-900 text-sm">{d.activeIssues}</div>
                <div className="text-amber-700">Open Tasks</div>
              </div>
              <div className="p-2.5 bg-emerald-50 rounded-xl">
                <div className="font-bold text-emerald-900 text-sm">{d.slaRate}</div>
                <div className="text-emerald-700">SLA Rate</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
