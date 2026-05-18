import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { io, type Socket } from 'socket.io-client';
import { useAuthStore } from '@shared/store/authStore';
import { useToast } from '@shared/components/ui/ToastProvider';

interface NotificationPayload {
  id: string;
  recipientUserId: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
}

const realtimeSocketUrl = import.meta.env.VITE_BACKEND_PUBLIC_URL || 'http://localhost:3000';

export function useGlobalSocketNotifications(onNewNotification?: () => void) {
  const currentUserId = useAuthStore((state) => state.userId);
  const token = useAuthStore((state) => state.token);
  const location = useLocation();
  const toast = useToast();

  useEffect(() => {
    if (!token || !currentUserId) return;

    const socket: Socket = io(realtimeSocketUrl, {
      path: '/notifications-socket/',
      query: { userId: currentUserId },
      auth: {
        'x-user-id': currentUserId,
        Authorization: `Bearer ${token}`,
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    const handleNewNotification = (payload: NotificationPayload) => {
      // Show Toast Notification
      // Determine toast type based on notification type
      const toastType = payload.type === 'MIEMBRO_RECHAZADO' ? 'error' : 'info';
      toast.push(payload.message, toastType);

      // Reload notification bell
      if (onNewNotification) {
        onNewNotification();
      }
    };

    socket.on('notification:new', handleNewNotification);

    return () => {
      socket.off('notification:new', handleNewNotification);
      socket.disconnect();
    };
  }, [currentUserId, token, location.pathname, toast, onNewNotification]);
}
