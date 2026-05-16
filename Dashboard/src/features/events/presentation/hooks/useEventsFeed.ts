import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuthStore } from '@shared/store/authStore';
import { eventsHttpService } from '../../infrastructure/eventsHttpService';
import type { EventCardSummary } from '../../domain/events';

export function useEventsFeed(limit = 20) {
  const token = useAuthStore((s) => s.token);

  const [events, setEvents] = useState<EventCardSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const hasEvents = useMemo(() => events.length > 0, [events.length]);

  const load = useCallback(async () => {
    if (!token) {
      setEvents([]);
      setError('No se encontró sesión activa para consultar eventos.');
      setLoading(false);
      return;
    }
    setLoading(true);
    const result = await eventsHttpService.getEvents(token, limit);
    if (result.success && result.data) {
      setEvents(result.data);
      setError(null);
    } else {
      setEvents([]);
      setError(result.error ?? 'No se pudieron cargar los eventos.');
    }
    setLoading(false);
  }, [token, limit]);

  useEffect(() => {
    void load();
  }, [load]);

  return { events, loading, error, hasEvents, reload: load };
}
