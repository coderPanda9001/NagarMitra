import React from 'react';
import { IssueStatus } from '../../types';

interface IssueStatusBadgeProps {
  status: IssueStatus;
  size?: 'sm' | 'md';
}

export const IssueStatusBadge: React.FC<IssueStatusBadgeProps> = ({
  status,
  size = 'md',
}) => {
  const statusConfig: Record<IssueStatus, { label: string; bg: string; text: string; border: string }> = {
    Reported: { label: 'Reported', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
    'Under Review': { label: 'Under Review', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
    Confirmed: { label: 'Confirmed', bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
    Assigned: { label: 'Assigned', bg: 'bg-cyan-50', text: 'text-cyan-800', border: 'border-cyan-200' },
    'Work Scheduled': { label: 'Work Scheduled', bg: 'bg-sky-50', text: 'text-sky-800', border: 'border-sky-200' },
    'In Progress': { label: 'In Progress', bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200' },
    'Resolution Submitted': { label: 'Resolution Submitted', bg: 'bg-orange-50', text: 'text-orange-800', border: 'border-orange-200' },
    'Awaiting Verification': { label: 'Awaiting Verification', bg: 'bg-fuchsia-50', text: 'text-fuchsia-800', border: 'border-fuchsia-200' },
    Resolved: { label: 'Resolved', bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200' },
    Verified: { label: 'Verified', bg: 'bg-teal-50', text: 'text-teal-800', border: 'border-teal-200' },
    Reopened: { label: 'Reopened', bg: 'bg-rose-50', text: 'text-rose-800', border: 'border-rose-200' },
    Rejected: { label: 'Rejected', bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-300' },
    Duplicate: { label: 'Duplicate', bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-300' },
  };

  const config = statusConfig[status] || {
    label: status,
    bg: 'bg-slate-50',
    text: 'text-slate-700',
    border: 'border-slate-200',
  };

  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${sizeClasses} ${config.bg} ${config.text} ${config.border}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-70" />
      {config.label}
    </span>
  );
};
