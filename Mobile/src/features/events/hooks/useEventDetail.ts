import { useAuthStore } from '@/src/store/authStore';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { eventsHttpService } from '../services/eventsHttpService';
import type { EventDetail } from '../types/events';

export function useEventDetail(eventId?: string) {
  const { token } = useAuthStore();

  const [event, setEvent] = useState<EventDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadEventDetail = useCallback(
    async (isActive?: () => boolean) => {
      if (!token || !eventId) {
        if (!isActive || isActive()) {
          setError('No se pudo identificar el evento.');
          setIsLoading(false);
        }
        return;
      }

      if (!isActive || isActive()) {
        setIsLoading(true);
      }

      const response = await eventsHttpService.getEventById(eventId, token);

      if (!isActive || isActive()) {
        if (response.success && response.data) {
          setEvent(response.data);
          setError(null);
        } else {
          setEvent(null);
          setError(response.error ?? 'No fue posible cargar el detalle del evento.');
        }

        setIsLoading(false);
      }
    },
    [eventId, token]
  );

  useFocusEffect(
    useCallback(() => {
      let active = true;
      const isActive = () => active;

      loadEventDetail(isActive);

      return () => {
        active = false;
      };
    }, [loadEventDetail])
  );

  return {
    event,
    isLoading,
    error,
    retry: () => loadEventDetail(),
  };
}
