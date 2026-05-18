import { API_BASE_URL } from '@shared/services/api/apiClient';
import type { ApiResponse, PublicProfile, PublicProfileSubject } from '../domain/search';

const normalizeAvatarUrl = (value: string | null): string | null => {
  if (!value || value.trim() === '') return null;
  const trimmed = value.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  if (trimmed.startsWith('//')) return `https:${trimmed}`;
  const origin = API_BASE_URL.replace(/\/api$/, '');
  return trimmed.startsWith('/') ? `${origin}${trimmed}` : `${origin}/${trimmed}`;
};

const normalizeSubjects = (raw: unknown[]): PublicProfileSubject[] =>
  raw.map((subject, index) => {
    if (typeof subject === 'object' && subject !== null) {
      const s = subject as Record<string, unknown>;
      if (typeof s.id === 'string' && typeof s.name === 'string') {
        return { id: s.id, name: s.name };
      }
    }
    return {
      id: `subject-${index}`,
      name: typeof subject === 'string' ? subject : 'Materia desconocida',
    };
  });

export const publicProfileHttpService = {
  /** GET /api/profiles/:profileId/public */
  async getPublicProfile(profileId: string, token: string): Promise<ApiResponse<PublicProfile>> {
    try {
      const response = await fetch(`${API_BASE_URL}/profiles/${encodeURIComponent(profileId)}/public`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null) as Record<string, unknown> | null;
        return {
          success: false,
          error: (typeof errorData?.error === 'string' ? errorData.error : null)
            ?? `Error ${response.status}: ${response.statusText}`,
        };
      }

      const responseData = await response.json() as Record<string, unknown>;
      const profileData = (responseData.data as Record<string, unknown>) ?? responseData;

      const subjects = Array.isArray(profileData.subjects)
        ? normalizeSubjects(profileData.subjects as unknown[])
        : [];

      const profile: PublicProfile = {
        id: (typeof profileData.id === 'string' ? profileData.id : null) ?? profileId,
        full_name: (typeof profileData.full_name === 'string' ? profileData.full_name : null)
          ?? (typeof profileData.name === 'string' ? profileData.name : ''),
        career: typeof profileData.career === 'string' ? profileData.career : null,
        semester: typeof profileData.semester === 'number' ? profileData.semester : null,
        phone_number: typeof profileData.phone_number === 'string' ? profileData.phone_number : null,
        avatar_url: normalizeAvatarUrl(typeof profileData.avatar_url === 'string' ? profileData.avatar_url : null),
        subjects,
      };

      return { success: true, data: profile };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido al obtener el perfil',
      };
    }
  },
};
