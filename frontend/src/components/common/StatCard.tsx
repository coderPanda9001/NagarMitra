import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: {
    value: string;
    isPositive?: boolean;
  };
  variant?: 'default' | 'accent' | 'warning' | 'success';
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = 'default',
}) => {
  const variantStyles = {
    default: 'bg-white border-slate-200 text-slate-900',
    accent: 'bg-blue-50/50 border-blue-200 text-blue-950',
    warning: 'bg-amber-50/50 border-amber-200 text-amber-950',
    success: 'bg-emerald-50/50 border-emerald-200 text-emerald-950',
  };

  const iconStyles = {
    default: 'text-slate-500 bg-slate-100',
    accent: 'text-blue-700 bg-blue-100',
    warning: 'text-amber-700 bg-amber-100',
    success: 'text-emerald-700 bg-emerald-100',
  };

  return (
    <div className={`p-4 rounded-xl border shadow-sm transition-all hover:shadow-md ${variantStyles[variant]}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</span>
        {Icon && (
          <div className={`p-2 rounded-lg ${iconStyles[variant]}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-2xl font-bold tracking-tight">{value}</span>
        {trend && (
          <span
            className={`text-xs font-medium ${
              trend.isPositive ? 'text-emerald-600' : 'text-rose-600'
            }`}
          >
            {trend.value}
          </span>
        )}
      </div>
      {subtitle && <p className="mt-1 text-xs text-slate-500">{subtitle}</p>}
    </div>
  );
};
