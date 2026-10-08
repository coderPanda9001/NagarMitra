import React from 'react';
import { NavLink } from 'react-router-dom';
import { Role } from '../../types';
import { LayoutDashboard, PlusCircle, MapPin, CheckSquare, Shield, Layers, Users, Bell } from 'lucide-react';

interface MobileNavigationProps {
  role: Role;
}

export const MobileNavigation: React.FC<MobileNavigationProps> = ({ role }) => {
  const getNavItems = () => {
    switch (role) {
      case 'Citizen':
        return [
          { label: 'Dashboard', path: '/citizen', icon: LayoutDashboard },
          { label: 'Report', path: '/citizen/report', icon: PlusCircle },
          { label: 'My Issues', path: '/citizen/issues', icon: MapPin },
          { label: 'Notifs', path: '/citizen/notifications', icon: Bell },
        ];
      case 'Authority':
        return [
          { label: 'Dashboard', path: '/authority', icon: LayoutDashboard },
          { label: 'Triage', path: '/authority/triage', icon: Layers },
          { label: 'Issues', path: '/authority/issues', icon: PlusCircle },
          { label: 'Map', path: '/authority/map', icon: MapPin },
        ];
      case 'Worker':
        return [
          { label: 'Dashboard', path: '/worker', icon: LayoutDashboard },
          { label: 'Assigned', path: '/worker/assigned', icon: CheckSquare },
          { label: 'Active', path: '/worker/active', icon: Layers },
          { label: 'Completed', path: '/worker/completed', icon: CheckSquare },
          { label: 'Profile', path: '/worker/profile', icon: Users },
        ];
      case 'Admin':
        return [
          { label: 'Dashboard', path: '/admin', icon: Shield },
          { label: 'Users', path: '/admin/users', icon: Users },
          { label: 'Settings', path: '/admin/settings', icon: Shield },
        ];
      default:
        return [];
    }
  };

  const items = getNavItems();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-slate-200 flex items-center justify-around z-40 px-2 shadow-lg">
      {items.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          end={item.path === `/citizen` || item.path === `/authority` || item.path === `/worker` || item.path === `/admin`}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center w-full py-1 text-[11px] font-medium transition-colors ${
              isActive ? 'text-blue-700 font-bold' : 'text-slate-500 hover:text-slate-800'
            }`
          }
        >
          <item.icon className="w-5 h-5 mb-0.5" />
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
};
