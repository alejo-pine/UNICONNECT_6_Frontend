import { API_BASE_URL } from '@shared/services/api/apiClient';
import type { ApiResponse, Classmate, SearchSubject } from '../domain/search';

const getApiOrigin = (): string => {
  const trimmed = API_BASE_URL.replace(/\/+$/, '');
  return trimmed.endsWith('/api') ? trimmed.slice(0, -4) : trimmed;
};

const normalizeAvatarUrl = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  if (trimmed.startsWith('//')) return `https:${trimmed}`;
  const origin = getApiOrigin();
  return trimmed.startsWith('/') ? `${origin}${trimmed}` : `${origin}/${trimmed}`;
};

const normalizeClassmates = (items: Classmate[]): Classmate[] =>
  items.map((item) => ({ ...item, avatar_url: normalizeAvatarUrl(item.avatar_url) }));

const authHeaders = (token: string) => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${token}`,
  'Cache-Control': 'no-cache, no-store, must-revalidate',
  Pragma: 'no-cache',
});

const safeJson = async (response: Response): Promise<unknown> => {
  try {
    return await response.json();
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

export const searchHttpService = {
  /** GET /api/profile-subjects/:profileId — materias inscritas del usuario autenticado */
  async getSubjectsByProfile(profileId: string, token: string): Promise<ApiResponse<SearchSubject[]>> {
    try {
      const response = await fetch(`${API_BASE_URL}/profile-subjects/${encodeURIComponent(profileId)}`, {
        headers: authHeaders(token),
      });
      const json = await safeJson(response);
      if (!response.ok) return { success: false, error: getError(json, response.status) };
      const data = json && typeof json === 'object' && 'data' in json
        ? (json as { data?: SearchSubject[] }).data
        : (json as SearchSubject[]);
      return { success: true, data: Array.isArray(data) ? data : [] };
    } catch {
      return { success: false, error: 'Error de conexión. Verifica tu conexión a internet.' };
    }
  },

  /** GET /api/students/classmates/:subjectId — compañeros inscritos en la materia */
  async getClassmatesBySubject(subjectId: string, token: string): Promise<ApiResponse<Classmate[]>> {
    try {
      const response = await fetch(`${API_BASE_URL}/students/classmates/${encodeURIComponent(subjectId)}`, {
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      });
      const json = await safeJson(response);
      if (!response.ok) return { success: false, error: getError(json, response.status) };
      const raw = json && typeof json === 'object' && 'data' in json
        ? (json as { data?: Classmate[] }).data
        : (json as Classmate[]);
      const classmates = Array.isArray(raw) ? raw : [];
      return { success: true, data: normalizeClassmates(classmates) };
    } catch {
      return { success: false, error: 'Error de conexión. Verifica tu conexión a internet.' };
    }
  },
};
