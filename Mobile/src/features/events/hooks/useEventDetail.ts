import { useAuthStore } from '@/src/store/authStore';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState, useEffect, useRef } from 'react';

import { eventsHttpService } from '../services/eventsHttpService';
import type { EventDetail } from '../types/events';
import { supabase } from '@/src/services/supabase';

export function useEventDetail(eventId?: string) {
  const { token } = useAuthStore();

  const [event, setEvent] = useState<EventDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

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

  return {
    event,
    isLoading,
    isActionLoading,
    error,
    retry: () => loadEventDetail(),
    registerToEvent,
    cancelRegistration,
  };
}
