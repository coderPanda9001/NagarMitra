import React from 'react';
import { NavLink } from 'react-router-dom';
import { Role } from '../../types';
import {
  LayoutDashboard,
  PlusCircle,
  ListFilter,
  Layers,
  MapPin,
  BarChart3,
  CheckSquare,
  Users,
  Settings,
  Shield,
  Bell,
  User,
  Clock,
  Briefcase,
  Bot,
  Activity,
  FileCode,
  Tag,
  AlertTriangle,
  FolderTree,
} from 'lucide-react';

interface SidebarProps {
  role: Role;
}

interface NavItem {
  label: string;
  path: string;
  icon: React.ElementType;
  roles: Role[];
}

const NAV_ITEMS: NavItem[] = [
  // Citizen Routes
  { label: 'Citizen Dashboard', path: '/citizen', icon: LayoutDashboard, roles: ['Citizen'] },
  { label: 'Report Issue', path: '/citizen/report', icon: PlusCircle, roles: ['Citizen'] },
  { label: 'My Issues', path: '/citizen/issues', icon: ListFilter, roles: ['Citizen'] },
  { label: 'Nearby Issues', path: '/citizen/nearby', icon: AlertTriangle, roles: ['Citizen'] },
  { label: 'City Map View', path: '/citizen/map', icon: MapPin, roles: ['Citizen'] },
  { label: 'Notifications', path: '/citizen/notifications', icon: Bell, roles: ['Citizen'] },
  { label: 'My Profile', path: '/citizen/profile', icon: User, roles: ['Citizen'] },

  // Authority Routes
  { label: 'Authority Dashboard', path: '/authority', icon: LayoutDashboard, roles: ['Authority'] },
  { label: 'Priority Queue', path: '/authority/queue', icon: Clock, roles: ['Authority'] },
  { label: 'All Issues', path: '/authority/issues', icon: ListFilter, roles: ['Authority'] },
  { label: 'Duplicate Review', path: '/authority/triage', icon: Layers, roles: ['Authority'] },
  { label: 'Assignments', path: '/authority/assignments', icon: Briefcase, roles: ['Authority'] },
  { label: 'City Map View', path: '/authority/map', icon: MapPin, roles: ['Authority'] },
  { label: 'Departments', path: '/authority/departments', icon: FolderTree, roles: ['Authority'] },
  { label: 'Field Teams', path: '/authority/teams', icon: Users, roles: ['Authority'] },
  { label: 'City Analytics', path: '/authority/analytics', icon: BarChart3, roles: ['Authority'] },
  { label: 'AI Assistant', path: '/authority/ai-assistant', icon: Bot, roles: ['Authority'] },
  { label: 'Audit Logs', path: '/authority/audit', icon: FileCode, roles: ['Authority'] },
  { label: 'Settings', path: '/authority/settings', icon: Settings, roles: ['Authority'] },

  // Worker Routes
  { label: 'Worker Dashboard', path: '/worker', icon: LayoutDashboard, roles: ['Worker'] },
  { label: 'Assigned Issues', path: '/worker/assigned', icon: CheckSquare, roles: ['Worker'] },
  { label: 'Active Work', path: '/worker/active', icon: Activity, roles: ['Worker'] },
  { label: 'Completed Repairs', path: '/worker/completed', icon: CheckSquare, roles: ['Worker'] },
  { label: 'Worker Profile', path: '/worker/profile', icon: User, roles: ['Worker'] },

  // Admin Routes
  { label: 'Admin Overview', path: '/admin', icon: Shield, roles: ['Admin'] },
  { label: 'User Management', path: '/admin/users', icon: Users, roles: ['Admin'] },
  { label: 'Departments', path: '/admin/departments', icon: FolderTree, roles: ['Admin'] },
  { label: 'Teams', path: '/admin/teams', icon: Users, roles: ['Admin'] },
  { label: 'Issue Categories', path: '/admin/categories', icon: Tag, roles: ['Admin'] },
  { label: 'SLA Rules', path: '/admin/sla', icon: Clock, roles: ['Admin'] },
  { label: 'System Health', path: '/admin/health', icon: Activity, roles: ['Admin'] },
  { label: 'Audit Logs', path: '/admin/audit', icon: FileCode, roles: ['Admin'] },
  { label: 'System Settings', path: '/admin/settings', icon: Settings, roles: ['Admin'] },
];

export const Sidebar: React.FC<SidebarProps> = ({ role }) => {
  const filteredItems = NAV_ITEMS.filter((item) => item.roles.includes(role));

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 hidden md:flex flex-col shrink-0 border-r border-slate-800">
      <div className="p-4 border-b border-slate-800">
        <span className="text-[11px] font-bold tracking-wider uppercase text-slate-400">
          {role} Workspace
        </span>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-8rem)]">
        {filteredItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === `/citizen` || item.path === `/authority` || item.path === `/worker` || item.path === `/admin`}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                isActive
                  ? 'bg-blue-700 text-white shadow-xs font-semibold'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`
            }
          >
            <item.icon className="w-4 h-4 shrink-0" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-800 text-xs text-slate-400">
        <p className="font-semibold text-slate-300">NagarMitra v1.0</p>
        <p className="text-[11px] text-slate-400 mt-0.5">Municipal Operations</p>
      </div>
    </aside>
  );
};
