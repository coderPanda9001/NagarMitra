import React from 'react';
import { DemoBadge } from '../../components/common/DemoBadge';
import { Layers, Clock, Plus } from 'lucide-react';

export const AdminCategories: React.FC = () => {
  const categories = [
    {
      name: 'Roads & Potholes',
      dept: 'Roads & Infrastructure',
      slaDefault: '24 hrs',
      priorityDefault: 'High',
      autoRoute: true,
    },
    {
      name: 'Street Lighting & Power',
      dept: 'Electrical Wing',
      slaDefault: '12 hrs',
      priorityDefault: 'Medium',
      autoRoute: true,
    },
    {
      name: 'Garbage & Sanitation',
      dept: 'Solid Waste Management',
      slaDefault: '8 hrs',
      priorityDefault: 'High',
      autoRoute: true,
    },
    {
      name: 'Water Supply & Leakage',
      dept: 'Hydraulic Engineer Dept',
      slaDefault: '12 hrs',
      priorityDefault: 'Critical',
      autoRoute: true,
    },
    {
      name: 'Drainage & Sewage',
      dept: 'Drainage Dept',
      slaDefault: '24 hrs',
      priorityDefault: 'High',
      autoRoute: true,
    },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900">Issue Taxonomy & Categories</h1>
            <DemoBadge />
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Configure civic issue categories, AI classification weights, and auto-dispatch rules
          </p>
        </div>
        <button
          type="button"
          onClick={() => alert('Demo: Add taxonomy category form.')}
          className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-semibold shadow flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Add Category
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-xs uppercase tracking-wider">
              <tr>
                <th className="p-4">Category Name</th>
                <th className="p-4">Default Department</th>
                <th className="p-4">Target SLA</th>
                <th className="p-4">Base Severity</th>
                <th className="p-4">AI Auto-Route</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {categories.map((c, i) => (
                <tr key={i} className="hover:bg-slate-50/60 transition-colors">
                  <td className="p-4 font-bold text-slate-900 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-blue-600" /> {c.name}
                  </td>
                  <td className="p-4 text-slate-700 text-xs">{c.dept}</td>
                  <td className="p-4 text-slate-600 text-xs font-semibold flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" /> {c.slaDefault}
                  </td>
                  <td className="p-4">
                    <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-xs font-bold rounded">
                      {c.priorityDefault}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-xs font-bold rounded">
                      Active
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
