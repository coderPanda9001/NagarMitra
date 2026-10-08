import React, { useState } from 'react';
import { DemoBadge } from '../../components/common/DemoBadge';
import { Save, Shield, Sliders, Check } from 'lucide-react';

export const AuthoritySettings: React.FC = () => {
  const [potholeSla, setPotholeSla] = useState(24);
  const [waterSla, setWaterSla] = useState(12);
  const [duplicateThreshold, setDuplicateThreshold] = useState(85);
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl font-bold text-slate-900">Ward Configuration & SLA Triggers</h1>
            <DemoBadge label="Ward Parameters" />
          </div>
          <p className="text-xs text-slate-500">
            Configure automated escalation thresholds, SLA target hours, and AI duplicate confidence rules.
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="bg-white rounded-xl border border-slate-200 p-6 space-y-6 shadow-xs">
        {saved && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-semibold flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" /> Ward parameters updated successfully!
          </div>
        )}

        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-blue-700" /> Target SLA Resolution Deadlines (Hours)
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Roads & Potholes Target SLA (Hours)
              </label>
              <input
                type="number"
                value={potholeSla}
                onChange={(e) => setPotholeSla(Number(e.target.value))}
                className="w-full p-2.5 border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Water Main Leakage Target SLA (Hours)
              </label>
              <input
                type="number"
                value={waterSla}
                onChange={(e) => setWaterSla(Number(e.target.value))}
                className="w-full p-2.5 border border-slate-300 rounded-lg"
              />
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Shield className="w-4 h-4 text-blue-700" /> AI Duplicate Threshold Configuration
          </h3>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between font-semibold text-slate-700">
              <span>Geospatial Similarity Match Threshold:</span>
              <span className="text-blue-700 font-bold">{duplicateThreshold}%</span>
            </div>
            <input
              type="range"
              min="50"
              max="95"
              value={duplicateThreshold}
              onChange={(e) => setDuplicateThreshold(Number(e.target.value))}
              className="w-full accent-blue-600 cursor-pointer"
            />
            <p className="text-[11px] text-slate-500">
              Candidates scoring above {duplicateThreshold}% match will be automatically flagged for one-click merge in the Triage queue.
            </p>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 flex justify-end">
          <button
            type="submit"
            className="px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
          >
            <Save className="w-4 h-4" /> Save Configuration
          </button>
        </div>
      </form>
    </div>
  );
};
