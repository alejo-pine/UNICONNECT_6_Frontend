import { useAuthStore } from '@/src/store/authStore';
import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';

import { eventsHttpService } from '../services/eventsHttpService';
import type { EventCardSummary } from '../types/events';

export function useEventsFeed(limit = 20) {
  const { token } = useAuthStore();

  const [events, setEvents] = useState<EventCardSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasEvents = useMemo(() => events.length > 0, [events.length]);

  const loadEvents = useCallback(
    async (refresh = false, isActive?: () => boolean) => {
      if (!token) {
        if (!isActive || isActive()) {
          setEvents([]);
          setError('No se encontró sesión activa para consultar eventos.');
          setIsLoading(false);
          setIsRefreshing(false);
        }
        return;
      }

      if (!isActive || isActive()) {
        if (refresh) {
          setIsRefreshing(true);
        } else {
          setIsLoading(true);
        }
      }

      const response = await eventsHttpService.getEvents(token, limit);

      if (!isActive || isActive()) {
        if (response.success && response.data) {
          setEvents(response.data);
          setError(null);
        } else {
          setEvents([]);
          setError(response.error ?? 'No se pudieron cargar los eventos.');
        }

        if (refresh) {
          setIsRefreshing(false);
        } else {
          setIsLoading(false);
        }
      }
    },
    [limit, token]
  );

  useFocusEffect(
    useCallback(() => {
      let active = true;
      const isActive = () => active;

      loadEvents(false, isActive);

      return () => {
        active = false;
      };
    }, [loadEvents])
  );

  return {
    events,
    isLoading,
    isRefreshing,
    error,
    hasEvents,
    refreshEvents: () => loadEvents(true),
  };
}
