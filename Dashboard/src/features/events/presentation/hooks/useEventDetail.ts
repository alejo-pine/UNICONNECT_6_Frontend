import { useCallback, useEffect, useState } from 'react';
import { useAuthStore } from '@shared/store/authStore';
import { eventsHttpService } from '../../infrastructure/eventsHttpService';
import type { EventDetail } from '../../domain/events';

export function useEventDetail(eventId?: string) {
  const token = useAuthStore((s) => s.token);

  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token || !eventId) {
      setError('No se pudo identificar el evento.');
      setLoading(false);
      return;
    }
    setLoading(true);
    const result = await eventsHttpService.getEventById(eventId, token);
    if (result.success && result.data) {
      setEvent(result.data);
      setError(null);
    } else {
      setEvent(null);
      setError(result.error ?? 'No fue posible cargar el detalle del evento.');
    }
    setLoading(false);
  }, [eventId, token]);

  useEffect(() => {
    void load();
  }, [load]);

  return { event, loading, error, retry: load };
}
