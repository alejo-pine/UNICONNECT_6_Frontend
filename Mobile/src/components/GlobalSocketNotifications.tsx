import { useAuthStore } from '@/src/store/authStore';
import { SOCKET_BASE_URL } from '@/src/config/api';
import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import { io, type Socket } from 'socket.io-client';

const realtimeSocketUrl = SOCKET_BASE_URL;

interface NotificationPayload {
  id: string;
  recipientUserId: string;
  title: string;
  message: string;
  type: string;
  groupId?: string;
  read: boolean;
  createdAt: string;
}

interface Props {}

export function GlobalSocketNotifications(_props: Props) {
  const { userId, token, addNotification } = useAuthStore();
  const socketRef = useRef<Socket | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!token || !userId) return;

    const socket = io(realtimeSocketUrl, {
      path: '/notifications-socket/',
      query: { userId },
      auth: { 'x-user-id': userId, Authorization: `Bearer ${token}` },
      // polling first so Socket.IO handshakes via HTTP before upgrading to WS
      transports: ['polling', 'websocket'],
      reconnection: true,
      reconnectionDelay: 2000,
      reconnectionAttempts: 10,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[GlobalSocketNotifications] ✅ Connected to:', realtimeSocketUrl);
    });

    socket.on('connect_error', (error) => {
      console.error('[GlobalSocketNotifications] ❌ Connection Error to', realtimeSocketUrl, ':', error.message);
    });

    const handleNewNotification = (payload: NotificationPayload) => {
      if (__DEV__) {
        console.log('[GlobalSocketNotifications] notification:new', payload);
      }

      // Push directly into global store - updates badge counter instantly
      addNotification({
        id: payload.id,
        recipientUserId: payload.recipientUserId,
        type: payload.type,
        message: payload.message,
        groupId: payload.groupId,
        read: false,
        createdAt: payload.createdAt,
      });

      // 2. Show native alert based on type
      if (payload.type === 'TRANSFERENCIA_ADMIN') {
        Alert.alert(
          'Transferencia de Administración',
          payload.message,
          [
            { text: 'Cerrar', style: 'cancel' },
            {
              text: 'Ver grupos',
              onPress: () => router.navigate('/study-groups'),
            },
          ]
        );
      } else if (payload.type === 'SOLICITUD_INGRESO') {
        Alert.alert('Nueva Solicitud', payload.message);
      } else if (payload.type === 'MIEMBRO_ACEPTADO') {
        Alert.alert('Solicitud Aceptada', payload.message);
      } else if (payload.type === 'MIEMBRO_RECHAZADO') {
        Alert.alert('Solicitud Rechazada', payload.message);
      }
      // SISTEMA / NUEVO_EVENTO: solo actualiza campana, sin alert
    };

    socket.on('notification:new', handleNewNotification);

    return () => {
      socket.off('notification:new', handleNewNotification);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [userId, token, router, addNotification]);

  return null;
}
