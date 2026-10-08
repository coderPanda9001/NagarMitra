import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, Home } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-4 shadow-sm">
        <div className="w-12 h-12 bg-slate-100 text-slate-500 rounded-full flex items-center justify-center mx-auto">
          <ShieldAlert className="w-6 h-6 text-slate-700" />
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900">404</h1>
        <h2 className="text-base font-bold text-slate-800">Page Not Found</h2>
        <p className="text-xs text-slate-500 max-w-xs mx-auto">
          The requested municipal portal route does not exist or has been relocated.
        </p>
        <div className="flex justify-center gap-3 pt-2">
          <Link
            to="/"
            className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
          >
            <Home className="w-3.5 h-3.5" /> Return Home
          </Link>
        </div>
      </div>
    </div>
  );
};
