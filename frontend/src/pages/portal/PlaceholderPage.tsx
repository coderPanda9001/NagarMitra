import React from 'react';
import { useLocation } from 'react-router-dom';
import { DemoBadge } from '../../components/common/DemoBadge';
import { Role } from '../../types';

interface PlaceholderPageProps {
  title: string;
  role: Role;
  description?: string;
}

export const PlaceholderPage: React.FC<PlaceholderPageProps> = ({
  title,
  role,
  description = 'Module structure initialized. Full feature workflow ready for implementation.',
}) => {
  const location = useLocation();

  const roleColors: Record<Role, string> = {
    Citizen: 'bg-blue-50 text-blue-700 border-blue-200',
    Authority: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    Worker: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Admin: 'bg-slate-100 text-slate-700 border-slate-300',
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-0.5 text-xs font-semibold rounded border ${roleColors[role]}`}>
              {role} Portal
            </span>
            <DemoBadge label="Setup Ready" />
          </div>
          <span className="text-[11px] font-mono text-slate-400">Route: {location.pathname}</span>
        </div>

        <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
        <p className="text-xs text-slate-500 max-w-2xl">{description}</p>
      </div>
    </div>
  );
};
