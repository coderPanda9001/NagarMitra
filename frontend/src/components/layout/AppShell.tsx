import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Topbar } from './Topbar';
import { Sidebar } from './Sidebar';
import { MobileNavigation } from './MobileNavigation';
import { useAuth } from '../../context/AuthContext';
import { Role } from '../../types';

interface AppShellProps {
  children: React.ReactNode;
}

const PUBLIC_PATHS = ['/', '/login', '/register', '/how-it-works', '/about', '/unauthorized'];

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const { currentUser, login } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const isPublicPage = PUBLIC_PATHS.includes(location.pathname);

  const handleRoleChange = async (newRole: Role) => {
    await login(newRole);
    navigate(`/${newRole.toLowerCase()}`);
  };

  if (isPublicPage) {
    return <div className="min-h-screen bg-slate-50">{children}</div>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
      <Topbar currentUser={currentUser} onRoleChange={handleRoleChange} />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar role={currentUser.role} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-20 md:pb-6">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
      <MobileNavigation role={currentUser.role} />
    </div>
  );
};
