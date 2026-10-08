import { User, Role } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

export interface IAuthService {
  getCurrentUser(): User;
  login(role: Role): Promise<User>;
  loginWithCredentials(email: string, password: string): Promise<User>;
  registerUser(name: string, email: string, password: string, role?: Role, ward?: string): Promise<User>;
  logout(): Promise<void>;
  getAllUsers(): User[];
  getToken(): string | null;
}

const DEMO_USERS: Record<Role, User> = {
  Citizen: {
    id: 'usr-citizen-demo',
    name: 'Aarav Sharma',
    email: 'citizen@demo.org',
    role: 'Citizen',
    phone: '+91 98200 12345',
    ward: 'Ward K-West',
    createdAt: '2026-01-15T08:30:00Z',
  },
  Authority: {
    id: 'usr-authority-demo',
    name: 'Officer Rajesh Varma',
    email: 'authority@demo.org',
    role: 'Authority',
    departmentId: 'dept-roads',
    phone: '+91 98211 54321',
    ward: 'Ward K-West',
    createdAt: '2025-11-01T10:00:00Z',
  },
  Worker: {
    id: 'usr-worker-demo',
    name: 'Ramesh Shinde',
    email: 'worker@demo.org',
    role: 'Worker',
    departmentId: 'dept-roads',
    phone: '+91 98922 99887',
    ward: 'Ward K-West',
    createdAt: '2025-12-10T09:15:00Z',
  },
  Admin: {
    id: 'usr-admin-demo',
    name: 'Vikram Mehta',
    email: 'admin@demo.org',
    role: 'Admin',
    phone: '+91 98000 00001',
    createdAt: '2025-09-01T00:00:00Z',
  },
};

class HybridAuthService implements IAuthService {
  private activeUser: User = DEMO_USERS.Citizen;

  constructor() {
    const savedUser = localStorage.getItem('nagarmitra_user') || localStorage.getItem('civictrack_user');
    if (savedUser) {
      try {
        this.activeUser = JSON.parse(savedUser);
      } catch (e) {
        this.activeUser = DEMO_USERS.Citizen;
      }
    }
  }

  getToken(): string | null {
    return localStorage.getItem('nagarmitra_token') || localStorage.getItem('civictrack_token');
  }

  getCurrentUser(): User {
    return this.activeUser;
  }

  async login(role: Role): Promise<User> {
    if (USE_MOCK) {
      this.activeUser = DEMO_USERS[role] || DEMO_USERS.Citizen;
      localStorage.setItem('nagarmitra_user', JSON.stringify(this.activeUser));
      return this.activeUser;
    }

    // Try real API login with demo credentials for selected role
    const demoEmail = DEMO_USERS[role]?.email || 'citizen@demo.org';
    return this.loginWithCredentials(demoEmail, 'password123');
  }

  async loginWithCredentials(email: string, password: string): Promise<User> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || 'Invalid email or password');
      }

      const data = await response.json();
      localStorage.setItem('nagarmitra_token', data.access_token);

      const user: User = {
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        role: data.user.role,
        phone: data.user.phone,
        ward: data.user.ward,
        departmentId: data.user.department_id,
        createdAt: data.user.created_at,
      };

      this.activeUser = user;
      localStorage.setItem('nagarmitra_user', JSON.stringify(user));
      return user;
    } catch (err) {
      if (USE_MOCK) {
        this.activeUser = DEMO_USERS.Citizen;
        return this.activeUser;
      }
      throw err;
    }
  }

  async registerUser(name: string, email: string, password: string, role: Role = 'Citizen', ward: string = 'Ward K-West'): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, role, ward }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.detail || 'Registration failed');
    }

    // Auto login after registration
    return this.loginWithCredentials(email, password);
  }

  async logout(): Promise<void> {
    localStorage.removeItem('nagarmitra_token');
    localStorage.removeItem('nagarmitra_user');
    localStorage.removeItem('civictrack_token');
    localStorage.removeItem('civictrack_user');
    this.activeUser = DEMO_USERS.Citizen;
  }

  getAllUsers(): User[] {
    return Object.values(DEMO_USERS);
  }
}

export const authService = new HybridAuthService();
