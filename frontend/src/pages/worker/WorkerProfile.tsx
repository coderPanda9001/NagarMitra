import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { DemoBadge } from '../../components/common/DemoBadge';
import { Shield, Phone, Mail, MapPin, Award, Wrench } from 'lucide-react';

export const WorkerProfile: React.FC = () => {
  const { currentUser } = useAuth();

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-6 pb-20 md:pb-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-bold text-slate-900">Worker Profile</h1>
            <DemoBadge />
          </div>
          <p className="text-xs md:text-sm text-slate-500">
            Field Squad Dispatch & Team Credentials
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
        <div className="flex items-center gap-4 border-b border-slate-100 pb-5">
          <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-2xl border-2 border-blue-200">
            {currentUser?.name.charAt(0) || 'W'}
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">{currentUser?.name || 'Ramesh Shinde'}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="px-2.5 py-0.5 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full flex items-center gap-1">
                <Wrench className="w-3 h-3" /> Field Worker
              </span>
              <span className="text-xs text-slate-500 font-medium">ID: WRK-8842</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-3">
            <Mail className="w-4 h-4 text-slate-400 shrink-0" />
            <div>
              <div className="text-xs text-slate-500">Email Address</div>
              <div className="font-semibold text-slate-800">{currentUser?.email || 'worker@mumbai.gov.in'}</div>
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-3">
            <Phone className="w-4 h-4 text-slate-400 shrink-0" />
            <div>
              <div className="text-xs text-slate-500">Field Phone</div>
              <div className="font-semibold text-slate-800">+91 98200 99112</div>
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-3">
            <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
            <div>
              <div className="text-xs text-slate-500">Assigned Ward</div>
              <div className="font-semibold text-slate-800">Ward K-West (Andheri West)</div>
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-3">
            <Shield className="w-4 h-4 text-slate-400 shrink-0" />
            <div>
              <div className="text-xs text-slate-500">Department Unit</div>
              <div className="font-semibold text-slate-800">Roads & Infrastructure Squad #1</div>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-5 space-y-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
            <Award className="w-4 h-4 text-amber-500" /> Performance Badges & Stats
          </h3>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
              <div className="text-xl font-black text-blue-900">42</div>
              <div className="text-[11px] text-blue-700 font-medium">Repairs Completed</div>
            </div>
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
              <div className="text-xl font-black text-emerald-900">98%</div>
              <div className="text-[11px] text-emerald-700 font-medium">SLA On-Time Rate</div>
            </div>
            <div className="p-3 bg-purple-50 rounded-xl border border-purple-100">
              <div className="text-xl font-black text-purple-900">4.9 ★</div>
              <div className="text-[11px] text-purple-700 font-medium">Citizen Rating</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
