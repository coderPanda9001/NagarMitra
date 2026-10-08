import React, { useState } from 'react';
import { CivicLogo } from '../common/CivicLogo';
import { DemoBadge } from '../common/DemoBadge';
import { Role, User } from '../../types';
import { Bell, UserCheck, ChevronDown, MapPin } from 'lucide-react';

interface TopbarProps {
  currentUser: User;
  onRoleChange: (newRole: Role) => void;
  unreadNotificationsCount?: number;
}

export const Topbar: React.FC<TopbarProps> = ({
  currentUser,
  onRoleChange,
  unreadNotificationsCount = 2,
}) => {
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);

  const roles: Role[] = ['Citizen', 'Authority', 'Worker', 'Admin'];

  return (
    <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-40 px-4 flex items-center justify-between shadow-xs">
      <div className="flex items-center gap-3">
        <CivicLogo size="sm" />
        <DemoBadge label="Demo Platform" />
      </div>

      <div className="flex items-center gap-4">
        {currentUser.ward && (
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1 bg-slate-100 rounded-full text-xs text-slate-600 font-medium">
            <MapPin className="w-3.5 h-3.5 text-blue-700" />
            {currentUser.ward}
          </div>
        )}

        {/* Role Switcher for Demo Purposes */}
        <div className="relative">
          <button
            onClick={() => setRoleMenuOpen(!roleMenuOpen)}
            className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 rounded-lg text-xs font-semibold transition-colors"
          >
            <UserCheck className="w-4 h-4 text-blue-700" />
            <span>Role: <strong className="text-blue-700">{currentUser.role}</strong></span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
          </button>

          {roleMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-3 py-1.5 border-b border-slate-100">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Switch Active Role (Demo)
                </p>
              </div>
              {roles.map((r) => (
                <button
                  key={r}
                  onClick={async () => {
                    setRoleMenuOpen(false);
                    await onRoleChange(r);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs font-medium flex items-center justify-between hover:bg-slate-50 ${
                    currentUser.role === r ? 'text-blue-700 font-bold bg-blue-50/50' : 'text-slate-700'
                  }`}
                >
                  <span>{r} View</span>
                  {currentUser.role === r && <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Notifications Icon */}
        <div className="relative">
          <button className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors relative">
            <Bell className="w-5 h-5" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-600 rounded-full border-2 border-white" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
