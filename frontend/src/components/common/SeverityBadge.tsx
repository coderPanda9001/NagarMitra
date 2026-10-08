import React from 'react';
import { IssueSeverity } from '../../types';
import { AlertTriangle } from 'lucide-react';

interface SeverityBadgeProps {
  severity: IssueSeverity;
  size?: 'sm' | 'md';
  showIcon?: boolean;
}

export const SeverityBadge: React.FC<SeverityBadgeProps> = ({
  severity,
  size = 'md',
  showIcon = false,
}) => {
  const styles: Record<IssueSeverity, string> = {
    Low: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    Medium: 'bg-amber-50 text-amber-800 border-amber-200',
    High: 'bg-orange-50 text-orange-900 border-orange-300 font-semibold',
    Critical: 'bg-rose-100 text-rose-900 border-rose-300 font-bold animate-pulse',
  };

  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1 rounded border ${sizeClasses} ${
        styles[severity] || styles.Medium
      }`}
    >
      {showIcon && <AlertTriangle className="w-3 h-3" />}
      {severity} Severity
    </span>
  );
};
