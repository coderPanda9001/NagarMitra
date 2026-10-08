import React from 'react';
import { DemoBadge } from '../../components/common/DemoBadge';

export const AuthorityDepartments: React.FC = () => {
  const departments = [
    {
      name: 'Roads & Infrastructure',
      code: 'DEPT-ROADS',
      head: 'Chief Engineer V. K. Kulkarni',
      teams: 6,
      openIssues: 120,
      resolvedThisMonth: 430,
      avgResolutionHours: 24.2,
    },
    {
      name: 'Hydraulics & Water Supply',
      code: 'DEPT-WATER',
      head: 'Superintending Engineer S. Patil',
      teams: 4,
      openIssues: 50,
      resolvedThisMonth: 130,
      avgResolutionHours: 32.5,
    },
    {
      name: 'Solid Waste Management',
      code: 'DEPT-SWM',
      head: 'Sanitation Officer M. Deshmukh',
      teams: 8,
      openIssues: 40,
      resolvedThisMonth: 340,
      avgResolutionHours: 19.8,
    },
    {
      name: 'Street Lighting & Electrical',
      code: 'DEPT-ELEC',
      head: 'Executive Engineer R. Varma',
      teams: 3,
      openIssues: 25,
      resolvedThisMonth: 215,
      avgResolutionHours: 18.5,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl font-bold text-slate-900">Municipal Departments Overview</h1>
            <DemoBadge label="Department Data" />
          </div>
          <p className="text-xs text-slate-500">
            Monitor active departmental teams, open grievance backlogs, and resolution SLAs.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {departments.map((d) => (
          <div key={d.code} className="bg-white rounded-xl border border-slate-200 p-6 space-y-4 shadow-xs">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-mono font-bold text-slate-400">{d.code}</span>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">{d.name}</h3>
              </div>
              <span className="px-2.5 py-0.5 text-xs font-semibold bg-blue-50 text-blue-700 rounded border border-blue-200">
                {d.teams} Teams Active
              </span>
            </div>

            <p className="text-xs text-slate-600">
              Department Head: <strong className="text-slate-800">{d.head}</strong>
            </p>

            <div className="grid grid-cols-3 gap-3 text-center text-xs">
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Open Backlog</span>
                <span className="text-base font-bold text-amber-700">{d.openIssues}</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Resolved (Mo)</span>
                <span className="text-base font-bold text-emerald-700">{d.resolvedThisMonth}</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Avg SLA Time</span>
                <span className="text-base font-bold text-blue-700">{d.avgResolutionHours}h</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
