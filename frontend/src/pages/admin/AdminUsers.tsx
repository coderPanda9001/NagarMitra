import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Role, User as UserType } from '../../types';
import { DemoBadge } from '../../components/common/DemoBadge';
import { Users, Edit2, Shield, Search, Check, X } from 'lucide-react';

const roleSchema = z.object({
  role: z.enum(['Citizen', 'Authority', 'Worker', 'Admin']),
  ward: z.string().min(1, 'Ward designation is required'),
  department: z.string().optional(),
});

type RoleFormData = z.infer<typeof roleSchema>;

export const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<UserType[]>([
    {
      id: 'usr-1',
      name: 'Aarav Sharma',
      email: 'aarav@citizen.org',
      role: 'Citizen',
      ward: 'Ward K-West',
      createdAt: '2026-01-15',
    },
    {
      id: 'usr-2',
      name: 'Priya Deshmukh',
      email: 'priya@bmc.gov.in',
      role: 'Authority',
      ward: 'Ward K-West',
      departmentId: 'dept-roads',
      createdAt: '2025-11-20',
    },
    {
      id: 'usr-3',
      name: 'Ramesh Shinde',
      email: 'ramesh.s@worker.bmc.gov.in',
      role: 'Worker',
      ward: 'Ward K-West',
      departmentId: 'dept-roads',
      createdAt: '2026-02-01',
    },
    {
      id: 'usr-4',
      name: 'Vikram Mehta',
      email: 'admin@nagarmitra.org',
      role: 'Admin',
      ward: 'All Wards (Central)',
      createdAt: '2025-10-01',
    },
    {
      id: 'usr-5',
      name: 'Neha Kapoor',
      email: 'neha.k@citizen.org',
      role: 'Citizen',
      ward: 'Ward H-East',
      createdAt: '2026-03-10',
    },
  ]);

  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<RoleFormData>({
    resolver: zodResolver(roleSchema),
  });

  const handleOpenEditModal = (user: UserType) => {
    setSelectedUser(user);
    setValue('role', user.role);
    setValue('ward', user.ward || 'Ward K-West');
    setValue('department', user.departmentId || 'Roads & Infrastructure');
  };

  const onSubmitRoleChange = (data: RoleFormData) => {
    if (!selectedUser) return;
    setUsers((prev) =>
      prev.map((u) =>
        u.id === selectedUser.id
          ? { ...u, role: data.role as Role, ward: data.ward, departmentId: data.department }
          : u
      )
    );
    setSuccessToast(`Updated permissions for ${selectedUser.name} to ${data.role}`);
    setSelectedUser(null);
    setTimeout(() => setSuccessToast(null), 3000);
  };

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.role.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900">User & Access Management</h1>
            <DemoBadge />
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Assign platform roles: Citizen, Authority, Worker, and System Admin
          </p>
        </div>
        <span className="px-3.5 py-1.5 bg-blue-100 text-blue-900 text-xs font-semibold rounded-full flex items-center gap-1.5 self-start sm:self-auto">
          <Users className="w-4 h-4" /> {users.length} Total Registered Users
        </span>
      </div>

      {successToast && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>{successToast}</span>
          </div>
          <button onClick={() => setSuccessToast(null)} className="text-emerald-700 hover:text-emerald-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Search & Filter */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by user name, email, or role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-xs uppercase tracking-wider">
              <tr>
                <th className="p-4">User</th>
                <th className="p-4">Role</th>
                <th className="p-4">Ward / Region</th>
                <th className="p-4">Department</th>
                <th className="p-4">Joined Date</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-800 font-bold flex items-center justify-center text-xs border border-blue-200">
                        {u.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">{u.name}</div>
                        <div className="text-xs text-slate-500">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        u.role === 'Admin'
                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                          : u.role === 'Authority'
                          ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                          : u.role === 'Worker'
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="p-4 text-slate-700 text-xs font-medium">{u.ward || 'N/A'}</td>
                  <td className="p-4 text-slate-600 text-xs">{u.departmentId || 'Unassigned'}</td>
                  <td className="p-4 text-slate-500 text-xs">{u.createdAt}</td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => handleOpenEditModal(u)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg inline-flex items-center gap-1 transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" /> Edit Role
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Role Edit Modal (React Hook Form + Zod) */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4 border border-slate-200 relative animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-700" /> Edit User Access & Role
              </h3>
              <button onClick={() => setSelectedUser(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-0.5">
              <div className="font-bold text-slate-900">{selectedUser.name}</div>
              <div className="text-slate-500">{selectedUser.email}</div>
            </div>

            <form onSubmit={handleSubmit(onSubmitRoleChange)} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Target Platform Role</label>
                <select
                  {...register('role')}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-600 focus:outline-none"
                >
                  <option value="Citizen">Citizen (Public Reporter)</option>
                  <option value="Authority">Authority (Department Official)</option>
                  <option value="Worker">Worker (Field Squad Repairer)</option>
                  <option value="Admin">Admin (System Administrator)</option>
                </select>
                {errors.role && <p className="text-[11px] text-rose-600 mt-1">{errors.role.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Ward Jurisdiction</label>
                <input
                  type="text"
                  {...register('ward')}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
                {errors.ward && <p className="text-[11px] text-rose-600 mt-1">{errors.ward.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Department</label>
                <input
                  type="text"
                  {...register('department')}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedUser(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-blue-700 hover:bg-blue-800 text-white rounded-lg shadow"
                >
                  Save Access Rights
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
