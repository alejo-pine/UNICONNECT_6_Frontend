import { API_BASE_URL } from '@shared/services/api/apiClient';
import { useAuthStore } from '@shared/store/authStore';
import type { ModerationHistoryResponse, ModerationRecord } from '../domain/moderationHistory';

const safeJson = async (res: Response): Promise<unknown> => {
  try {
    return await res.json();
  } catch {
    return null;
  }
};

const getError = (payload: unknown, status: number): string => {
  if (payload && typeof payload === 'object') {
    const obj = payload as Record<string, unknown>;
    if (typeof obj.error === 'string' && obj.error.trim()) return obj.error;
    if (typeof obj.message === 'string' && obj.message.trim()) return obj.message;
  }
  return `Error ${status}`;
};

const toStr = (v: unknown): string => (typeof v === 'string' ? v : '');

const normalizeRecord = (raw: unknown): ModerationRecord => {
  const r = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  return {
    id: toStr(r.id),
    user_id: toStr(r.user_id),
    rejection_code: toStr(r.rejection_code),
    reason: toStr(r.reason),
    blocked_until: typeof r.blocked_until === 'string' ? r.blocked_until : null,
    created_at: toStr(r.created_at),
  };
};

export const moderationHistoryService = {
  async getHistory(): Promise<ModerationHistoryResponse> {
    try {
      const token = useAuthStore.getState().token;
      const response = await fetch(`${API_BASE_URL}/admin/moderation-history`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const json = await safeJson(response);

      if (response.status === 401) {
        return { success: false, error: getError(json, 401), statusCode: 401 };
      }

      if (response.status === 403) {
        return { success: false, error: getError(json, 403), statusCode: 403 };
      }

      if (!response.ok) {
        return { success: false, error: getError(json, response.status), statusCode: response.status };
      }

      const items: unknown[] = Array.isArray(json) ? json : [];
      return { success: true, data: items.map(normalizeRecord) };
    } catch {
      return { success: false, error: 'Error de conexión. Verifica tu conexión a internet.' };
    }
  },
};
