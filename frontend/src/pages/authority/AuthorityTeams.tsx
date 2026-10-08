import React from 'react';
import { DemoBadge } from '../../components/common/DemoBadge';
import { Phone, MapPin } from 'lucide-react';

export const AuthorityTeams: React.FC = () => {
  const teams = [
    {
      id: 'team-1',
      name: 'Rapid Action Road Squad 1',
      dept: 'Roads & Infrastructure',
      leader: 'Suresh Patil (Field Engineer)',
      phone: '+91 98922 99887',
      ward: 'Ward H/West (Bandra)',
      workers: 5,
      activeJobs: 2,
      status: 'On Duty',
    },
    {
      id: 'team-2',
      name: 'Water Main Maintenance Crew 2',
      dept: 'Hydraulics & Water Supply',
      leader: 'Anil Kulkarni',
      phone: '+91 98211 44332',
      ward: 'Ward K/West (Andheri)',
      workers: 4,
      activeJobs: 1,
      status: 'On Duty',
    },
    {
      id: 'team-3',
      name: 'Sanitation Rapid Clearance Crew 4',
      dept: 'Solid Waste Management',
      leader: 'Ramesh Pawar',
      phone: '+91 98333 11223',
      ward: 'Ward H/West (Bandra)',
      workers: 8,
      activeJobs: 3,
      status: 'On Duty',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl font-bold text-slate-900">Field Squad Teams & Workers</h1>
            <DemoBadge label="Field Roster" />
          </div>
          <p className="text-xs text-slate-500">
            Manage field engineers, active squad assignments, and work progress dispatches.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {teams.map((t) => (
          <div key={t.id} className="bg-white rounded-xl border border-slate-200 p-5 space-y-3 shadow-xs">
            <div className="flex justify-between items-start border-b border-slate-100 pb-2">
              <div>
                <span className="text-[10px] font-mono text-slate-400 font-bold">{t.dept}</span>
                <h3 className="font-bold text-slate-900 text-sm">{t.name}</h3>
              </div>
              <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-50 text-emerald-700 rounded border border-emerald-200">
                {t.status}
              </span>
            </div>

            <div className="space-y-1.5 text-xs text-slate-600">
              <p>Team Leader: <strong className="text-slate-900">{t.leader}</strong></p>
              <div className="flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-slate-400" /> <span>{t.phone}</span>
              </div>
              <div className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-blue-700" /> <span>{t.ward}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-between text-xs font-semibold">
              <span className="text-slate-500">{t.workers} Workers</span>
              <span className="text-blue-700">{t.activeJobs} Active Jobs</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
