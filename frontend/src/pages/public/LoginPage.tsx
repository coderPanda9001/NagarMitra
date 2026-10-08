import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Role } from '../../types';
import { CivicLogo } from '../../components/common/CivicLogo';
import { DemoBadge } from '../../components/common/DemoBadge';
import { LogIn, Shield, Building2, Wrench, User } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, loginWithCredentials } = useAuth();
  const [selectedRole, setSelectedRole] = useState<Role>('Citizen');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const roleConfigs: { role: Role; label: string; icon: React.ElementType; color: string; redirect: string }[] = [
    { role: 'Citizen', label: 'Citizen Portal', icon: User, color: 'bg-blue-50 text-blue-700 border-blue-200', redirect: '/citizen' },
    { role: 'Authority', label: 'Authority Officer', icon: Building2, color: 'bg-indigo-50 text-indigo-700 border-indigo-200', redirect: '/authority' },
    { role: 'Worker', label: 'Field Engineer', icon: Wrench, color: 'bg-emerald-50 text-emerald-700 border-emerald-200', redirect: '/worker' },
    { role: 'Admin', label: 'System Admin', icon: Shield, color: 'bg-slate-100 text-slate-700 border-slate-300', redirect: '/admin' },
  ];

  const handleLogin = async (roleToLogin: Role) => {
    setLoading(true);
    try {
      if (email && password) {
        const u = await loginWithCredentials(email, password);
        const config = roleConfigs.find((c) => c.role === u.role) || roleConfigs[0];
        navigate(config.redirect);
      } else {
        const u = await login(roleToLogin);
        const config = roleConfigs.find((c) => c.role === u.role) || roleConfigs[0];
        navigate(config.redirect);
      }
    } catch (err: any) {
      alert(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleLogin(selectedRole);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 shadow-lg p-6 md:p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-2">
            <CivicLogo size="md" />
          </div>
          <div className="flex items-center justify-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">Sign in to Portal</h1>
            <DemoBadge label="Demo Login" />
          </div>
          <p className="text-xs text-slate-500">
            Select a role to instantly test role-aware municipal workflows.
          </p>
        </div>

        {/* Quick Role Selectors for Evaluation */}
        <div className="space-y-2">
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Quick One-Click Demo Role Select
          </label>
          <div className="grid grid-cols-2 gap-2">
            {roleConfigs.map((cfg) => {
              const Icon = cfg.icon;
              return (
                <button
                  key={cfg.role}
                  type="button"
                  onClick={() => {
                    setSelectedRole(cfg.role);
                    handleLogin(cfg.role);
                  }}
                  className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition-all hover:shadow-xs ${cfg.color} ${
                    selectedRole === cfg.role ? 'ring-2 ring-blue-600 font-bold' : 'opacity-80'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <div>
                    <div className="text-xs font-semibold">{cfg.role}</div>
                    <div className="text-[10px] opacity-75">Instant Access</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="relative flex py-1 items-center">
          <div className="flex-grow border-t border-slate-200"></div>
          <span className="flex-shrink mx-3 text-[10px] text-slate-400 font-semibold uppercase">Or Standard Login</span>
          <div className="flex-grow border-t border-slate-200"></div>
        </div>

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Active Role Selection
            </label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as Role)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-600 bg-white"
            >
              <option value="Citizen">Citizen (Aarav Sharma)</option>
              <option value="Authority">Authority (Officer Rajesh Varma)</option>
              <option value="Worker">Worker (Suresh Patil)</option>
              <option value="Admin">Admin (Priya Nair)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Password
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2"
          >
            <LogIn className="w-4 h-4" />
            {loading ? 'Authenticating...' : `Sign In as ${selectedRole}`}
          </button>
        </form>

        <div className="pt-2 text-center text-xs text-slate-500 border-t border-slate-100 flex items-center justify-between">
          <span>Don't have a citizen account?</span>
          <Link to="/register" className="text-blue-700 font-semibold hover:underline">
            Register Citizen
          </Link>
        </div>
      </div>
    </div>
  );
};
