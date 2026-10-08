import React from 'react';
import { IssuePriority } from '../../types';

interface PriorityBadgeProps {
  priority: IssuePriority;
  size?: 'sm' | 'md';
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority, size = 'md' }) => {
  const styles: Record<IssuePriority, string> = {
    Low: 'bg-slate-100 text-slate-700 border-slate-200',
    Medium: 'bg-blue-50 text-blue-800 border-blue-200',
    High: 'bg-orange-50 text-orange-800 border-orange-200',
    Critical: 'bg-red-50 text-red-800 border-red-200 font-bold',
  };

  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center rounded border font-medium ${sizeClasses} ${
        styles[priority] || styles.Medium
      }`}
    >
      P: {priority}
    </span>
  );
};
