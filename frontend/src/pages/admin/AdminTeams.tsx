import React from 'react';
import { DemoBadge } from '../../components/common/DemoBadge';
import { Phone, MapPin, Wrench, Plus } from 'lucide-react';

export const AdminTeams: React.FC = () => {
  const squads = [
    {
      id: 'team-1',
      name: 'Rapid Action Road Squad 1',
      dept: 'Roads & Infrastructure',
      lead: 'Ramesh Shinde',
      phone: '+91 98200 99112',
      members: 6,
      ward: 'Ward K-West (Andheri W)',
      status: 'Active Field Duty',
    },
    {
      id: 'team-2',
      name: 'Sanitation Mobile Unit B',
      dept: 'Solid Waste Management',
      lead: 'Suresh More',
      phone: '+91 98200 88223',
      members: 8,
      ward: 'Ward K-East (Andheri E)',
      status: 'Standby / Available',
    },
    {
      id: 'team-3',
      name: 'Water Leak Emergency Response',
      dept: 'Water Supply',
      lead: 'Vijay Thorat',
      phone: '+91 98200 77334',
      members: 5,
      ward: 'Ward H-West (Bandra W)',
      status: 'Active Field Duty',
    },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900">Repair Teams & Field Squads</h1>
            <DemoBadge />
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Manage worker field units, team leads, and emergency dispatch readiness
          </p>
        </div>
        <button
          type="button"
          onClick={() => alert('Demo: Create team form ready for admin setup.')}
          className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-semibold shadow flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Create New Field Squad
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {squads.map((t) => (
          <div
            key={t.id}
            className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4 hover:border-blue-300 transition-colors flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 bg-blue-100 text-blue-800 text-[11px] font-semibold rounded-full">
                  {t.dept}
                </span>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded">
                  {t.status}
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900">{t.name}</h3>
              <div className="text-xs text-slate-600 space-y-1 pt-1">
                <div className="flex items-center gap-1.5">
                  <Wrench className="w-3.5 h-3.5 text-slate-400" />
                  <span>Squad Lead: <strong>{t.lead}</strong></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{t.phone}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>{t.ward}</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Roster: <strong>{t.members} Field Technicians</strong></span>
              <button className="text-blue-700 hover:text-blue-800 font-semibold">
                Manage Squad →
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
