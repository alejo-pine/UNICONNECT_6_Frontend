import { API_BASE_URL } from '@shared/services/api/apiClient';
import type { ApiResponse, EventCardSummary, EventDetail } from '../domain/events';

const EVENTS_ENDPOINT = `${API_BASE_URL}/events`;

const readJson = async (response: Response): Promise<unknown> => {
  try {
    return await response.json();
  } catch {
    return null;
  }
};

const getErrorMessage = (payload: unknown, status: number): string => {
  if (payload && typeof payload === 'object') {
    const obj = payload as Record<string, unknown>;
    if (typeof obj.error === 'string' && obj.error.trim()) return obj.error;
    if (typeof obj.message === 'string' && obj.message.trim()) return obj.message;
  }
  return `Error ${status}`;
};

const toIsoTime = (value: string): string => {
  const trimmed = value.trim();
  return trimmed.length === 5 ? `${trimmed}:00` : trimmed;
};

const toTimestamp = (eventDate: string, eventTime: string): number => {
  const date = new Date(`${eventDate}T${toIsoTime(eventTime)}`);
  const ts = date.getTime();
  return Number.isNaN(ts) ? Number.MAX_SAFE_INTEGER : ts;
};

const sortChronological = <T extends Pick<EventCardSummary, 'event_date' | 'event_time'>>(
  events: T[],
): T[] =>
  [...events].sort(
    (a, b) =>
      toTimestamp(a.event_date, a.event_time) - toTimestamp(b.event_date, b.event_time),
  );

const authHeaders = (token: string) => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${token}`,
});

export const eventsHttpService = {
  async getEvents(token: string, limit = 20): Promise<ApiResponse<EventCardSummary[]>> {
    try {
      const response = await fetch(`${EVENTS_ENDPOINT}?limit=${limit}`, {
        headers: authHeaders(token),
      });
      const payload = await readJson(response);
      if (!response.ok) return { success: false, error: getErrorMessage(payload, response.status) };

      const rawData =
        payload && typeof payload === 'object' && 'data' in payload
          ? (payload as { data?: any[] }).data
          : (payload as any[]);

      const events: EventCardSummary[] = (Array.isArray(rawData) ? rawData : []).map((row) => ({
        ...row,
        event_date: row.event_date || row.eventDate,
        event_time: row.event_time || row.eventTime,
        image_url: row.image_url || row.imageUrl,
      }));
      return { success: true, data: sortChronological(events) };
    } catch {
      return { success: false, error: 'Error de conexión. Verifica tu conexión a internet.' };
    }
  },

  async getEventById(eventId: string, token: string): Promise<ApiResponse<EventDetail>> {
    try {
      const response = await fetch(`${EVENTS_ENDPOINT}/${encodeURIComponent(eventId)}`, {
        headers: authHeaders(token),
      });
      const payload = await readJson(response);
      if (!response.ok) return { success: false, error: getErrorMessage(payload, response.status) };

      const rawEvent =
        payload && typeof payload === 'object' && 'data' in payload
          ? (payload as { data?: any }).data
          : payload;

      if (!rawEvent) return { success: false, error: 'No se encontró información del evento.' };
      
      const event: EventDetail = {
        ...rawEvent,
        event_date: rawEvent.event_date || rawEvent.eventDate,
        event_time: rawEvent.event_time || rawEvent.eventTime,
        image_url: rawEvent.image_url || rawEvent.imageUrl,
        profile_id: rawEvent.profile_id || rawEvent.profileId,
        organizer_name: rawEvent.organizer_name || rawEvent.organizerName,
        created_at: rawEvent.created_at || rawEvent.createdAt,
      };

      return { success: true, data: event };
    } catch {
      return { success: false, error: 'Error de conexión. Verifica tu conexión a internet.' };
    }
  },
  async createEvent(payload: { title: string; category: string; description?: string; imageUrl?: string; eventDate: string; eventTime: string; location?: string; faculty?: string }, token: string): Promise<ApiResponse<{ id: string; title: string; category: string }>> {
    try {
      const response = await fetch(EVENTS_ENDPOINT, {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify(payload),
      });
      const data = await readJson(response);
      if (!response.ok) return { success: false, error: getErrorMessage(data, response.status) };
      const result =
        data && typeof data === 'object' && 'data' in data
          ? (data as { data?: { id: string; title: string; category: string } }).data
          : undefined;
      return { success: true, data: result };
    } catch {
      return { success: false, error: 'Error de conexión al crear el evento.' };
    }
  },

  async getSubscriptions(token: string): Promise<ApiResponse<string[]>> {
    try {
      const response = await fetch(`${EVENTS_ENDPOINT}/suscripciones`, {
        headers: authHeaders(token),
      });
      const payload = await readJson(response);
      if (!response.ok) return { success: false, error: getErrorMessage(payload, response.status) };
      const data =
        payload && typeof payload === 'object' && 'data' in payload
          ? (payload as { data?: string[] }).data
          : [];
      return { success: true, data: Array.isArray(data) ? data : [] };
    } catch {
      return { success: false, error: 'Error de conexión al obtener suscripciones.' };
    }
  },

  async subscribeCategory(category: string, token: string): Promise<ApiResponse<void>> {
    try {
      const response = await fetch(`${EVENTS_ENDPOINT}/suscribir`, {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify({ category }),
      });
      const payload = await readJson(response);
      if (!response.ok) return { success: false, error: getErrorMessage(payload, response.status) };
      return { success: true };
    } catch {
      return { success: false, error: 'Error de conexión al suscribirse.' };
    }
  },

  async unsubscribeCategory(category: string, token: string): Promise<ApiResponse<void>> {
    try {
      const response = await fetch(`${EVENTS_ENDPOINT}/suscribir`, {
        method: 'DELETE',
        headers: authHeaders(token),
        body: JSON.stringify({ category }),
      });
      const payload = await readJson(response);
      if (!response.ok) return { success: false, error: getErrorMessage(payload, response.status) };
      return { success: true };
    } catch {
      return { success: false, error: 'Error de conexión al desuscribirse.' };
    }
  },
};
