/**
 * Servicio HTTP para perfil público de estudiante
 * Maneja las peticiones al endpoint /api/profiles/:id/public
 */
import { API_BASE_URL } from '../../../config/api';
import { PublicProfile } from '../types/publicProfile';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Normaliza URLs de avatar relativas a URLs absolutas
 */
const normalizeAvatarUrl = (value: string | null, baseUrl: string): string | null => {
  if (!value || value.trim() === '') {
    return null;
  }

  const trimmed = value.trim();

  // Si ya es una URL completa, retornarla tal cual
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }

  // Si es protocol-relative
  if (trimmed.startsWith('//')) {
    return `https:${trimmed}`;
  }

  // Construir URL absoluta con el base URL
  const origin = baseUrl.replace(/\/api$/, '');
  
  if (trimmed.startsWith('/')) {
    return `${origin}${trimmed}`;
  }

  return `${origin}/${trimmed}`;
};

/**
 * Obtiene el perfil público de un estudiante
 * @param profileId - ID del perfil a obtener
 * @param token - Token de autenticación del usuario actual
 */
export const getPublicProfile = async (
  profileId: string,
  token: string
): Promise<ApiResponse<PublicProfile>> => {
  try {
    const response = await fetch(`${API_BASE_URL}/profiles/${profileId}/public`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      return {
        success: false,
        error: errorData?.error || `Error ${response.status}: ${response.statusText}`,
      };
    }

    const responseData = await response.json();

    // Extraer los datos reales (backend envuelve en { data: {...} })
    const profileData = responseData.data || responseData;

    // Transformar subjects de array de strings a array de objetos
    const subjects = Array.isArray(profileData.subjects)
      ? profileData.subjects.map((subject: string | { id: string; name: string }, index: number) => {
          // Si ya es un objeto con id y name, retornarlo tal cual
          if (typeof subject === 'object' && subject.id && subject.name) {
            return subject;
          }
          // Si es un string, convertirlo a objeto
          return {
            id: `subject-${index}`,
            name: typeof subject === 'string' ? subject : subject.name || 'Materia desconocida',
          };
        })
      : [];

    // Normalizar avatar_url antes de retornar
    const normalizedData: PublicProfile = {
      id: profileData.id || profileId,
      full_name: profileData.full_name || profileData.name || '',
      career: profileData.career || null,
      semester: profileData.semester || null,
      phone_number: profileData.phone_number || null,
      avatar_url: normalizeAvatarUrl(profileData.avatar_url, API_BASE_URL),
      subjects: subjects,
    };

    return {
      success: true,
      data: normalizedData,
    };
  } catch (error) {
    console.error('[publicProfileHttpService] Error fetching public profile:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido al obtener el perfil',
    };
  }
};

export const publicProfileHttpService = {
  getPublicProfile,
};
