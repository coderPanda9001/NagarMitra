import React, { useState } from 'react';
import { DemoMapPreview } from '../../components/map/DemoMapPreview';
import { MapLegend } from '../../components/map/MapLegend';
import { DemoBadge } from '../../components/common/DemoBadge';
import { Layers } from 'lucide-react';

export const AuthorityMapPage: React.FC = () => {
  const [activeLayer, setActiveLayer] = useState<'Clustered' | 'Severity' | 'Hotspots'>('Clustered');

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-slate-900">Authority Spatial Map & Hotspots</h1>
            <DemoBadge label="Ward GIS Layer" />
          </div>
          <p className="text-xs text-slate-500">
            Geospatial density heatmap, severity marker distribution, and ward boundary analytics.
          </p>
        </div>

        {/* Layer Controls */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
          <span className="text-slate-400 flex items-center gap-1">
            <Layers className="w-3.5 h-3.5" /> Layer Mode:
          </span>
          {[
            { id: 'Clustered', label: 'All Markers' },
            { id: 'Severity', label: 'Critical Severity Heatmap' },
            { id: 'Hotspots', label: 'Recurring Hotspots' },
          ].map((l) => (
            <button
              key={l.id}
              onClick={() => setActiveLayer(l.id as any)}
              className={`px-3 py-1.5 rounded-lg border transition-colors ${
                activeLayer === l.id
                  ? 'bg-blue-700 text-white border-blue-700'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>

      {/* Map Display */}
      <div className="relative">
        <DemoMapPreview />
        <div className="absolute bottom-4 left-4 z-10 hidden md:block">
          <MapLegend />
        </div>
      </div>
    </div>
  );
};
