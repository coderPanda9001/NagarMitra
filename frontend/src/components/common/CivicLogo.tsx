import React from 'react';
import { ShieldCheck, Sparkles } from 'lucide-react';

interface CivicLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showSubtext?: boolean;
}

export const CivicLogo: React.FC<CivicLogoProps> = ({
  size = 'md',
  showSubtext = true,
}) => {
  const iconSizes = {
    sm: 'w-5 h-5',
    md: 'w-7 h-7',
    lg: 'w-9 h-9',
  };

  const textSizes = {
    sm: 'text-base',
    md: 'text-xl',
    lg: 'text-2xl',
  };

  return (
    <div className="flex items-center gap-2 select-none">
      <div className="relative flex items-center justify-center p-2 rounded-lg bg-blue-900 text-white shadow-sm">
        <ShieldCheck className={iconSizes[size]} />
        <Sparkles className="w-3 h-3 text-sky-400 absolute -top-1 -right-1 animate-pulse" />
      </div>
      <div>
        <div className={`font-bold tracking-tight text-slate-900 ${textSizes[size]} flex items-center gap-1.5`}>
          NagarMitra <span className="px-1.5 py-0.5 text-xs font-semibold uppercase bg-sky-100 text-sky-800 rounded border border-sky-200">AI</span>
        </div>
        {showSubtext && (
          <p className="text-[10px] text-slate-500 font-medium tracking-wide uppercase">
            Smart Civic Resolution Platform
          </p>
        )}
      </div>
    </div>
  );
};
