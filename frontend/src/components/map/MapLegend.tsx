import React from 'react';

export const MapLegend: React.FC = () => {
  return (
    <div className="bg-white/95 backdrop-blur-xs p-3 rounded-xl border border-slate-200 shadow-md text-xs space-y-2">
      <h4 className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">Map Legend</h4>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[11px] text-slate-600">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-blue-600 shrink-0" />
          <span>Roads & Potholes</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-sky-500 shrink-0" />
          <span>Water Leakage</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-amber-500 shrink-0" />
          <span>Garbage & Sanitation</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-yellow-500 shrink-0" />
          <span>Street Lighting</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-indigo-600 shrink-0" />
          <span>Drainage & Sewage</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-rose-600 shrink-0 animate-pulse" />
          <span>Critical Severity</span>
        </div>
      </div>
    </div>
  );
};
