import React from 'react';

export const DemoBadge: React.FC<{ label?: string }> = ({ label = 'Demo Data' }) => {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-800 border border-amber-300">
      {label}
    </span>
  );
};
