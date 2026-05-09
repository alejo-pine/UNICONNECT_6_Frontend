import { API_BASE_URL } from '@/src/config/api';
import { parseError } from '@/src/utils/errorHandler';
import type {
    ApiErrorResponse,
    ApiResponse,
    EventCardSummary,
    EventDetail,
} from '../types/events';

const EVENTS_ENDPOINT = `${API_BASE_URL}/events`;

const toIsoTime = (value: string): string => {
  const trimmed = value.trim();
  if (trimmed.length === 5) {
    return `${trimmed}:00`;
  }
  return trimmed;
};

const toTimestamp = (eventDate: string, eventTime: string): number => {
  const date = new Date(`${eventDate}T${toIsoTime(eventTime)}`);
  const timestamp = date.getTime();
  return Number.isNaN(timestamp) ? Number.MAX_SAFE_INTEGER : timestamp;
};

const sortByChronologicalOrder = <T extends Pick<EventCardSummary, 'event_date' | 'event_time'>>(
  events: T[]
): T[] => {
  return [...events].sort((left, right) => {
    return toTimestamp(left.event_date, left.event_time) - toTimestamp(right.event_date, right.event_time);
  });
};

const readJson = async (response: Response): Promise<unknown> => {
  try {
    return await response.json();
  } catch {
    return null;
  }
};

const getErrorMessage = (payload: unknown, fallbackStatus: number): string => {
  if (payload && typeof payload === 'object') {
    const maybeError = payload as ApiErrorResponse;
    if (maybeError.error && maybeError.error.trim().length > 0) {
      return maybeError.error;
    }
  }

  return `Error ${fallbackStatus}`;
};

export const eventsHttpService = {
  async getEvents(token: string, limit = 20): Promise<ApiResponse<EventCardSummary[]>> {
    try {
      const response = await fetch(`${EVENTS_ENDPOINT}?limit=${limit}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          Pragma: 'no-cache',
        },
      });

      const payload = await readJson(response);
      if (!response.ok) {
        throw new Error(getErrorMessage(payload, response.status));
      }

      const rawData =
        payload && typeof payload === 'object' && 'data' in payload
          ? (payload as { data?: EventCardSummary[] }).data
          : (payload as EventCardSummary[]);

      const events = Array.isArray(rawData) ? rawData : [];
      return { success: true, data: sortByChronologicalOrder(events) };
    } catch (error) {
      const appError = parseError(error);
      console.error('[eventsHttpService] getEvents error:', appError.message);
      return { success: false, error: appError.message };
    }
  },

  async getEventById(eventId: string, token: string): Promise<ApiResponse<EventDetail>> {
    try {
      const response = await fetch(`${EVENTS_ENDPOINT}/${eventId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          Pragma: 'no-cache',
        },
      });

      const payload = await readJson(response);
      if (!response.ok) {
        throw new Error(getErrorMessage(payload, response.status));
      }

      const event =
        payload && typeof payload === 'object' && 'data' in payload
          ? (payload as { data?: EventDetail }).data
          : (payload as EventDetail);

      if (!event) {
        throw new Error('No se encontró información del evento.');
      }

      return { success: true, data: event };
    } catch (error) {
      const appError = parseError(error);
      console.error('[eventsHttpService] getEventById error:', appError.message);
      return { success: false, error: appError.message };
    }
  },
};
