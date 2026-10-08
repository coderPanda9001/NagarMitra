import React, { useState } from 'react';
import { DemoMapPreview } from '../../components/map/DemoMapPreview';
import { MapLegend } from '../../components/map/MapLegend';
import { DemoBadge } from '../../components/common/DemoBadge';
import { Layers } from 'lucide-react';

export const CitizenMapPage: React.FC = () => {
  const [activeLayer, setActiveLayer] = useState<'All' | 'HighSeverity' | 'Potholes' | 'Water'>('All');

  return (
    <div className="space-y-4">
      {/* Header Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-slate-900">Citywide Ward Spatial Map</h1>
            <DemoBadge label="Interactive Map" />
          </div>
          <p className="text-xs text-slate-500">
            Geospatial visualization of open, active, and resolved complaints across Mumbai Wards.
          </p>
        </div>

        {/* Layer Controls */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
          <span className="text-slate-400 flex items-center gap-1">
            <Layers className="w-3.5 h-3.5" /> Layer:
          </span>
          {[
            { id: 'All', label: 'All Active' },
            { id: 'HighSeverity', label: 'High Severity' },
            { id: 'Potholes', label: 'Roads & Potholes' },
            { id: 'Water', label: 'Water Leakage' },
          ].map((layer) => (
            <button
              key={layer.id}
              onClick={() => setActiveLayer(layer.id as any)}
              className={`px-3 py-1.5 rounded-lg border transition-colors ${
                activeLayer === layer.id
                  ? 'bg-blue-700 text-white border-blue-700'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              {layer.label}
            </button>
          ))}
        </div>
      </div>

      {/* Map & Legend Display */}
      <div className="relative">
        <DemoMapPreview />
        <div className="absolute bottom-4 left-4 z-10 hidden md:block">
          <MapLegend />
        </div>
      </div>
    </div>
  );
};
