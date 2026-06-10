import { useCallback, useEffect, useState, useRef } from 'react';
import { useAuthStore } from '@shared/store/authStore';
import { eventsHttpService } from '../../infrastructure/eventsHttpService';
import type { EventDetail } from '../../domain/events';
import { supabase } from '@shared/services/api/supabaseClient';

export function useEventDetail(eventId?: string) {
  const token = useAuthStore((s) => s.token);

  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isActionLoading, setIsActionLoading] = useState(false);

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

  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const registerToEvent = async (): Promise<{ success: boolean; error?: string }> => {
    if (!token || !eventId || !event) return { success: false, error: 'Información incompleta.' };
    setIsActionLoading(true);
    const result = await eventsHttpService.registerToEvent(eventId, token);
    setIsActionLoading(false);

    if (result.success) {
      const newSpots = Math.max(0, event.available_spots - 1);
      setEvent((prev) => prev ? { ...prev, isRegistered: true, available_spots: newSpots } : prev);
      channelRef.current?.send({
        type: 'broadcast',
        event: 'spots_changed',
        payload: { available_spots: newSpots },
      });
    }
    return result;
  };

  const cancelRegistration = async (): Promise<{ success: boolean; error?: string }> => {
    if (!token || !eventId || !event) return { success: false, error: 'Información incompleta.' };
    setIsActionLoading(true);
    const result = await eventsHttpService.cancelRegistration(eventId, token);
    setIsActionLoading(false);

    if (result.success) {
      const newSpots = event.available_spots + 1;
      setEvent((prev) => prev ? { ...prev, isRegistered: false, available_spots: newSpots } : prev);
      channelRef.current?.send({
        type: 'broadcast',
        event: 'spots_changed',
        payload: { available_spots: newSpots },
      });
    }
    return result;
  };

  // Suscripción a cambios en tiempo real
  useEffect(() => {
    if (!eventId || !supabase) return;

    const channel = supabase.channel(`event_updates_${eventId}`);
    channelRef.current = channel;

    channel
      .on(
        'broadcast',
        { event: 'spots_changed' },
        (payload) => {
          const newSpots = payload.payload?.available_spots;
          if (typeof newSpots === 'number') {
            setEvent((prev) => (prev ? { ...prev, available_spots: newSpots } : prev));
          }
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [eventId]);

  return { event, loading, error, retry: load, isActionLoading, registerToEvent, cancelRegistration };
}
