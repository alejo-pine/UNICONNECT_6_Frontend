import { useAuthStore } from '@/src/store/authStore';
import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import { io, type Socket } from 'socket.io-client';
import { groupsHttpService } from '@/src/features/groups/services/groupsHttpService';

const realtimeSocketUrl = process.env.BACKEND_PUBLIC_URL || 'http://10.0.2.2:3000';

interface DomainEventPayload {
  type: 'SOLICITUD_INGRESO' | 'MIEMBRO_ACEPTADO' | 'MIEMBRO_RECHAZADO' | 'TRANSFERENCIA_ADMIN';
  groupId: string;
  actorUserId: string;
  data: any;
  timestamp: string;
}

export function GlobalSocketNotifications() {
  const { userId, token } = useAuthStore();
  const socketRef = useRef<Socket | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!token || !userId) return;

    const socket = io(realtimeSocketUrl, {
      auth: {
        'x-user-id': userId,
        Authorization: `Bearer ${token}`,
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    const joinUserRoom = () => {
      socket.emit('user:join', { userId });
    };

    const handleDomainEvent = (payload: DomainEventPayload) => {
      if (__DEV__) {
        console.log('[GlobalSocketNotifications] Event:', payload);
      }

      if (payload.type === 'TRANSFERENCIA_ADMIN') {
        // La data usualmente incluye { toUserId: string, ... }
        // Verificamos si somos nosotros a quienes transfieren
        if (payload.data?.toUserId === userId) {
          Alert.alert(
            'Transferencia de Administración',
            'Se te ha solicitado asumir la administración de un grupo de estudio.',
            [
              {
                text: 'Rechazar',
                style: 'cancel',
                onPress: async () => {
                  try {
                    await groupsHttpService.respondAdminTransfer(payload.groupId, false, token);
                  } catch (e) {
                    console.error('Error rejecting admin transfer', e);
                  }
                }
              },
              {
                text: 'Aceptar',
                onPress: async () => {
                  try {
                    const result = await groupsHttpService.respondAdminTransfer(payload.groupId, true, token);
                    if (result.success) {
                      Alert.alert('Éxito', 'Ahora eres el administrador del grupo.');
                      router.navigate('/study-groups');
                    } else {
                      Alert.alert('Error', result.error || 'No se pudo aceptar la transferencia.');
                    }
                  } catch (e) {
                    console.error('Error accepting admin transfer', e);
                  }
                }
              }
            ]
          );
        } else if (payload.actorUserId === userId && payload.data?.status === 'accepted') {
          Alert.alert('Transferencia de Administración', 'El usuario aceptó tu solicitud. Ya no eres administrador del grupo.');
          router.navigate('/study-groups');
        } else if (payload.actorUserId === userId && payload.data?.status === 'rejected') {
          Alert.alert('Transferencia de Administración', 'El usuario rechazó tu solicitud para transferirle la administración.');
        }
      } else if (payload.type === 'SOLICITUD_INGRESO') {
        Alert.alert('Nueva Solicitud', '¡Tienes una nueva solicitud de ingreso en tu grupo!');
      } else if (payload.type === 'MIEMBRO_ACEPTADO') {
        Alert.alert('Solicitud Aceptada', '¡Tu solicitud de ingreso fue aceptada!');
      } else if (payload.type === 'MIEMBRO_RECHAZADO') {
        Alert.alert('Solicitud Rechazada', 'Tu solicitud de ingreso ha sido rechazada.');
      }
    };

    socket.on('connect', joinUserRoom);
    socket.on('study-group:domain-event', handleDomainEvent);

    if (socket.connected) {
      joinUserRoom();
    }

    return () => {
      socket.off('connect', joinUserRoom);
      socket.off('study-group:domain-event', handleDomainEvent);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [userId, token, router]);

  return null;
}
