import { Notification, Role } from '../types';
import { authService } from './authService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

export interface INotificationService {
  getNotifications(userId: string, userRole: Role): Promise<Notification[]>;
  markAsRead(notificationId: string): Promise<void>;
  markAllAsRead(userId: string): Promise<void>;
}

const DEMO_NOTIFICATIONS: Notification[] = [
  {
    id: 'notif-1',
    userId: 'usr-citizen-demo',
    userRole: 'Citizen',
    title: 'Report Status Update',
    message: 'Your report CT-2026-00101 (Dangerous Deep Pothole) is in progress.',
    type: 'StatusUpdate',
    issueId: 'iss-demo-1',
    read: false,
    createdAt: '2026-10-03T12:00:00Z',
  },
];

let notificationsStore = [...DEMO_NOTIFICATIONS];

class HybridNotificationService implements INotificationService {
  private getAuthHeader(): Record<string, string> {
    const token = authService.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  async getNotifications(userId: string, userRole: Role): Promise<Notification[]> {
    if (!USE_MOCK) {
      try {
        const response = await fetch(`${API_BASE_URL}/notifications/`, {
          headers: this.getAuthHeader(),
        });
        if (response.ok) {
          const data = await response.json();
          return data;
        }
      } catch (err) {
        // Fallback
      }
    }
    return notificationsStore.filter((n) => n.userId === userId || n.userRole === userRole);
  }

  async markAsRead(notificationId: string): Promise<void> {
    if (!USE_MOCK) {
      try {
        await fetch(`${API_BASE_URL}/notifications/${notificationId}/read`, {
          method: 'PATCH',
          headers: this.getAuthHeader(),
        });
      } catch (err) {
        // Fallback
      }
    }
    const item = notificationsStore.find((n) => n.id === notificationId);
    if (item) {
      item.read = true;
    }
  }

  async markAllAsRead(userId: string): Promise<void> {
    if (!USE_MOCK) {
      try {
        const response = await fetch(`${API_BASE_URL}/notifications/mark-all-read`, {
          method: 'POST',
          headers: {
            ...this.getAuthHeader(),
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({}),
        });
        if (response.ok) {
          // Sync store after server confirms
          notificationsStore.forEach((n) => {
            if (n.userId === userId) {
              n.read = true;
            }
          });
          return;
        }
      } catch (err) {
        // Fallback to local-only
      }
    }
    notificationsStore.forEach((n) => {
      if (n.userId === userId) {
        n.read = true;
      }
    });
  }
}

export const notificationService = new HybridNotificationService();
