import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Role } from '../types';
import { authService } from '../services/authService';

interface AuthContextType {
  currentUser: User;
  role: Role;
  login: (role: Role) => Promise<User>;
  loginWithCredentials: (email: string, password: string) => Promise<User>;
  registerUser: (name: string, email: string, password: string, role?: Role, ward?: string) => Promise<User>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User>(authService.getCurrentUser());

  useEffect(() => {
    setCurrentUser(authService.getCurrentUser());
  }, []);

  const login = async (role: Role) => {
    const user = await authService.login(role);
    setCurrentUser({ ...user });
    return user;
  };

  const loginWithCredentials = async (email: string, password: string) => {
    const user = await authService.loginWithCredentials(email, password);
    setCurrentUser({ ...user });
    return user;
  };

  const registerUser = async (name: string, email: string, password: string, role: Role = 'Citizen', ward: string = 'Ward K-West') => {
    const user = await authService.registerUser(name, email, password, role, ward);
    setCurrentUser({ ...user });
    return user;
  };

  const logout = async () => {
    await authService.logout();
    setCurrentUser(authService.getCurrentUser());
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        role: currentUser ? currentUser.role : 'Citizen',
        login,
        loginWithCredentials,
        registerUser,
        logout,
        isAuthenticated: !!currentUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
