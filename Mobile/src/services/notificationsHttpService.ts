import { API_BASE_URL } from '../config/api';

export interface AppNotification {
  id: string;
  user_id: string;
  type: string;
  message: string;
  group_id?: string;
  read: boolean;
  created_at: string;
}

export interface ApiResponse<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

const NOTIFICATIONS_ENDPOINT = `${API_BASE_URL}/notifications`;

export const notificationsHttpService = {
  async getNotifications(token: string): Promise<ApiResponse<AppNotification[]>> {
    try {
      if (__DEV__) {
        console.log('[notificationsHttpService] GET', NOTIFICATIONS_ENDPOINT);
      }
      const response = await fetch(NOTIFICATIONS_ENDPOINT, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        return { success: false, error: `HTTP ${response.status}` };
      }

      const data = await response.json();
      const notifications: AppNotification[] = Array.isArray(data)
        ? data
        : Array.isArray(data?.data)
        ? data.data
        : [];

      const sorted = [...notifications].sort((a, b) => {
        if (a.read === b.read) {
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        }
        return a.read ? 1 : -1;
      });

      return { success: true, data: sorted };
    } catch (error) {
      console.error('[notificationsHttpService] getNotifications error:', error);
      return { success: false, error: 'Network error' };
    }
  },

  async markAsRead(notificationId: string, token: string): Promise<ApiResponse<void>> {
    try {
      const response = await fetch(`${NOTIFICATIONS_ENDPOINT}/${notificationId}/read`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        return { success: false, error: `HTTP ${response.status}` };
      }

      return { success: true };
    } catch (error) {
      console.error('[notificationsHttpService] markAsRead error:', error);
      return { success: false, error: 'Network error' };
    }
  },
};
