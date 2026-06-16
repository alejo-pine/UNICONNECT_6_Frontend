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
  async getEvents(
    token: string,
    options: { limit?: number; page?: number; search?: string; categories?: string[] } = {}
  ): Promise<ApiResponse<{ data: EventCardSummary[]; total: number }>> {
    try {
      const { limit = 10, page = 1, search, categories } = options;

      const queryParams = new URLSearchParams();
      queryParams.append('limit', limit.toString());
      queryParams.append('page', page.toString());
      if (search) queryParams.append('search', search);
      if (categories && categories.length > 0) queryParams.append('categories', categories.join(','));

      const response = await fetch(`${EVENTS_ENDPOINT}?${queryParams.toString()}`, {
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

      const responseData = payload && typeof payload === 'object' && 'data' in payload 
        ? (payload as any).data 
        : { data: [], total: 0 };

      const rawData = Array.isArray(responseData.data) ? responseData.data : [];
      const total = typeof responseData.total === 'number' ? responseData.total : 0;

      const events: EventCardSummary[] = rawData.map((row) => ({
        ...row,
        event_date: row.event_date || row.eventDate,
        event_time: row.event_time || row.eventTime,
        image_url: row.image_url || row.imageUrl,
        available_spots: row.available_spots ?? row.availableSpots ?? 50,
        capacity: row.capacity ?? 50,
      }));
      return { success: true, data: { data: sortByChronologicalOrder(events), total } };
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

      const rawEvent =
        payload && typeof payload === 'object' && 'data' in payload
          ? (payload as { data?: any }).data
          : payload;

      if (!rawEvent) {
        throw new Error('No se encontró información del evento.');
      }
      
      const event: EventDetail = {
        ...rawEvent,
        event_date: rawEvent.event_date || rawEvent.eventDate,
        event_time: rawEvent.event_time || rawEvent.eventTime,
        image_url: rawEvent.image_url || rawEvent.imageUrl,
        profile_id: rawEvent.profile_id || rawEvent.profileId,
        organizer_name: rawEvent.organizer_name || rawEvent.organizerName,
        created_at: rawEvent.created_at || rawEvent.createdAt,
        capacity: rawEvent.capacity || 50,
        available_spots: rawEvent.available_spots ?? rawEvent.availableSpots ?? 50,
        version: rawEvent.version || 1,
        isRegistered: rawEvent.isRegistered || false,
      };

      return { success: true, data: event };
    } catch (error) {
      const appError = parseError(error);
      console.error('[eventsHttpService] getEventById error:', appError.message);
      return { success: false, error: appError.message };
    }
  },

  async subscribeToCategory(category: string, token: string): Promise<ApiResponse<void>> {
    try {
      const response = await fetch(`${EVENTS_ENDPOINT}/suscribir`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ category }),
      });

      const payload = await readJson(response);
      if (!response.ok) {
        throw new Error(getErrorMessage(payload, response.status));
      }

      return { success: true, data: undefined };
    } catch (error) {
      const appError = parseError(error);
      console.error('[eventsHttpService] subscribeToCategory error:', appError.message);
      return { success: false, error: appError.message };
    }
  },

  async getSubscriptions(token: string): Promise<ApiResponse<string[]>> {
    try {
      const response = await fetch(`${EVENTS_ENDPOINT}/suscripciones`, {
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

      const data =
        payload && typeof payload === 'object' && 'data' in payload
          ? (payload as { data?: string[] }).data
          : [];
          
      return { success: true, data: Array.isArray(data) ? data : [] };
    } catch (error) {
      const appError = parseError(error);
      console.error('[eventsHttpService] getSubscriptions error:', appError.message);
      return { success: false, error: appError.message };
    }
  },

  async createEvent(
    payload: {
      title: string;
      category: string;
      description?: string;
      imageUrl?: string;
      eventDate: string;
      eventTime: string;
      location?: string;
      faculty?: string;
      capacity?: number;
    },
    token: string
  ): Promise<ApiResponse<{ id: string; title: string; category: string }>> {
    try {
      const response = await fetch(EVENTS_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await readJson(response);
      if (!response.ok) {
        throw new Error(getErrorMessage(data, response.status));
      }

      const result =
        data && typeof data === 'object' && 'data' in data
          ? (data as { data?: { id: string; title: string; category: string } }).data
          : undefined;

      return { success: true, data: result };
    } catch (error) {
      const appError = parseError(error);
      console.error('[eventsHttpService] createEvent error:', appError.message);
      return { success: false, error: appError.message };
    }
  },

  async unsubscribeFromCategory(category: string, token: string): Promise<ApiResponse<void>> {
    try {
      const response = await fetch(`${EVENTS_ENDPOINT}/suscribir`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ category }),
      });

      const payload = await readJson(response);
      if (!response.ok) {
        throw new Error(getErrorMessage(payload, response.status));
      }

      return { success: true, data: undefined };
    } catch (error) {
      const appError = parseError(error);
      console.error('[eventsHttpService] unsubscribeFromCategory error:', appError.message);
      return { success: false, error: appError.message };
    }
  },

  async registerToEvent(eventId: string, token: string): Promise<ApiResponse<void>> {
    try {
      const response = await fetch(`${EVENTS_ENDPOINT}/${encodeURIComponent(eventId)}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      const payload = await readJson(response);
      if (!response.ok) throw new Error(getErrorMessage(payload, response.status));
      return { success: true };
    } catch (error) {
      const appError = parseError(error);
      return { success: false, error: appError.message };
    }
  },

  async cancelRegistration(eventId: string, token: string): Promise<ApiResponse<void>> {
    try {
      const response = await fetch(`${EVENTS_ENDPOINT}/${encodeURIComponent(eventId)}/register`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      const payload = await readJson(response);
      if (!response.ok) throw new Error(getErrorMessage(payload, response.status));
      return { success: true };
    } catch (error) {
      const appError = parseError(error);
      return { success: false, error: appError.message };
    }
  },
};
