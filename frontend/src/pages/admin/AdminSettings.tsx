import React, { useState } from 'react';
import { DemoBadge } from '../../components/common/DemoBadge';
import { Save, Shield, Sliders, Check } from 'lucide-react';

export const AdminSettings: React.FC = () => {
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [autoMergeConfidence, setAutoMergeConfidence] = useState(90);
  const [notificationEmail, setNotificationEmail] = useState('admin@mumbai.gov.in');
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900">System Global Settings</h1>
            <DemoBadge />
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Configure system-wide AI parameters, emergency maintenance mode, and notifications
          </p>
        </div>
      </div>

      {saved && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>System configuration parameters updated successfully!</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Sliders className="w-5 h-5 text-blue-700" /> AI & Auto-Merge Engine Parameters
          </h2>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-bold text-slate-700">
                  Auto-Merge Similarity Confidence Threshold: <strong>{autoMergeConfidence}%</strong>
                </label>
              </div>
              <input
                type="range"
                min="70"
                max="98"
                value={autoMergeConfidence}
                onChange={(e) => setAutoMergeConfidence(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-700"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Reports exceeding this AI match score will automatically group into a master complaint ticket.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Shield className="w-5 h-5 text-indigo-700" /> Platform Security & Notifications
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                System Administrator Notification Dispatch Email
              </label>
              <input
                type="email"
                value={notificationEmail}
                onChange={(e) => setNotificationEmail(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <h4 className="text-xs font-bold text-slate-900">Maintenance Mode</h4>
                <p className="text-[11px] text-slate-500">
                  Temporarily pause new citizen report submissions during database upgrades.
                </p>
              </div>
              <input
                type="checkbox"
                checked={maintenanceMode}
                onChange={(e) => setMaintenanceMode(e.target.checked)}
                className="w-5 h-5 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="px-6 py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold shadow flex items-center gap-2 transition-transform active:scale-95"
          >
            <Save className="w-4 h-4" /> Save System Settings
          </button>
        </div>
      </form>
    </div>
  );
};
