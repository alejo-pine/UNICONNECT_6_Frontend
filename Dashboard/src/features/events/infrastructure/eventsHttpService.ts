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
          ? (payload as { data?: EventCardSummary[] }).data
          : (payload as EventCardSummary[]);

      const events = Array.isArray(rawData) ? rawData : [];
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

      const event =
        payload && typeof payload === 'object' && 'data' in payload
          ? (payload as { data?: EventDetail }).data
          : (payload as EventDetail);

      if (!event) return { success: false, error: 'No se encontró información del evento.' };
      return { success: true, data: event };
    } catch {
      return { success: false, error: 'Error de conexión. Verifica tu conexión a internet.' };
    }
  },
};
