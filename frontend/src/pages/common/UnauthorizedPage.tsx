import React from 'react';
import { Link } from 'react-router-dom';
import { Lock, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const UnauthorizedPage: React.FC = () => {
  const { role } = useAuth();

  const getDefaultRolePath = () => {
    switch (role) {
      case 'Citizen':
        return '/citizen';
      case 'Authority':
        return '/authority';
      case 'Worker':
        return '/worker';
      case 'Admin':
        return '/admin';
      default:
        return '/';
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl border border-rose-200 p-8 text-center space-y-4 shadow-sm">
        <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto">
          <Lock className="w-6 h-6" />
        </div>
        <h1 className="text-xl font-bold text-slate-900">403 — Unauthorized Access</h1>
        <p className="text-xs text-slate-600 max-w-xs mx-auto">
          Your current role (<strong className="text-rose-700">{role}</strong>) does not have permission to access this section of the municipal portal.
        </p>
        <div className="flex justify-center gap-3 pt-2">
          <Link
            to={getDefaultRolePath()}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to My Dashboard
          </Link>
          <Link
            to="/login"
            className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold rounded-lg transition-colors"
          >
            Switch Role
          </Link>
        </div>
      </div>
    </div>
  );
};
