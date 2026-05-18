import { API_BASE_URL } from '../api/apiClient';

export interface AppNotification {
  id: string;
  recipientUserId: string;
  type: string;
  message: string;
  groupId?: string;
  read: boolean;
  createdAt: string;
}

export const notificationsService = {
  async getNotifications(token: string, userId: string): Promise<AppNotification[]> {
    try {
      // Send userId as query parameter
      const response = await fetch(`${API_BASE_URL}/notifications?userId=${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }

      const data = await response.json();
      
      // Asegurarse de retornar el array de notificaciones
      // Dependiendo de cómo responda tu backend (ej. { data: [...] } o simplemente [...])
      const notifications: AppNotification[] = Array.isArray(data) ? data : (data.data || []);
      
      // Ordenar por createdAt descendente y mostrar primero las no leídas (read: false)
      return notifications.sort((a, b) => {
        if (a.read === b.read) {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        return a.read ? 1 : -1;
      });
    } catch (error) {
      console.error('[notificationsService] Error fetching notifications:', error);
      return [];
    }
  },

  async markAsRead(notificationId: string, token: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/notifications/${notificationId}/read`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      return response.ok;
    } catch (error) {
      console.error('[notificationsService] Error marking notification as read:', error);
      return false;
    }
  }
};
