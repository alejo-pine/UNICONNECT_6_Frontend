/**
 * Servicio HTTP para Materias del Usuario
 */

import { API_BASE_URL } from '@/src/config/api';

export interface Subject {
  id: string;
  name: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

const SUBJECTS_ENDPOINT = `${API_BASE_URL}/subjects`;
const PROFILE_SUBJECTS_ENDPOINT = `${API_BASE_URL}/profile-subjects`;

const readJson = async (response: Response): Promise<unknown> => {
  try {
    return await response.json();
  } catch {
    return null;
  }
};

const getErrorMessage = (payload: unknown, fallbackStatus: number): string => {
  if (payload && typeof payload === 'object') {
    const maybeError = payload as Record<string, unknown>;
    if (maybeError.error && typeof maybeError.error === 'string' && maybeError.error.trim().length > 0) {
      return maybeError.error;
    }
    if (maybeError.message && typeof maybeError.message === 'string' && maybeError.message.trim().length > 0) {
      return maybeError.message;
    }
  }
  return `Error ${fallbackStatus}`;
};

export const subjectsHttpService = {
  /**
   * Obtiene las materias del usuario autenticado
   * Backend devuelve: { data: [{ id, name }], error: null, statusCode: 200 }
   */
  async getUserSubjects(token: string): Promise<ApiResponse<Subject[]>> {
    try {
      const response = await fetch(`${SUBJECTS_ENDPOINT}/my-subjects`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const json = await readJson(response);

      if (response.ok) {
        // Extrae correctamente el array de materias según el formato del backend
        let subjectsArray: Subject[] = [];
        
        if (Array.isArray(json)) {
          // Si es un array directo
          subjectsArray = json;
        } else if (json && typeof json === 'object') {
          const payload = json as Record<string, unknown>;
          // Si tiene propiedad 'data' con el array
          if (Array.isArray(payload.data)) {
            subjectsArray = payload.data as Subject[];
          }
          // Si tiene propiedad 'subjects' con el array
          else if (Array.isArray(payload.subjects)) {
            subjectsArray = payload.subjects as Subject[];
          }
        }

        return {
          success: true,
          data: subjectsArray,
        };
      }

      return {
        success: false,
        error: getErrorMessage(json, response.status),
      };
    } catch (error) {
      console.error('[subjectsHttpService.getUserSubjects] Error de red:', error);
      return {
        success: false,
        error: 'Error de conexión. Verifica tu conexión a internet.',
      };
    }
  },

  /**
   * Obtiene materias por perfil (endpoint backend actual)
   * GET /api/profile-subjects/:profileId
   */
  async getSubjectsByProfile(profileId: string, token: string): Promise<ApiResponse<Subject[]>> {
    try {
      const response = await fetch(`${PROFILE_SUBJECTS_ENDPOINT}/${profileId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          Pragma: 'no-cache',
        },
      });

      const json = await readJson(response);

      if (response.ok) {
        let subjectsArray: Subject[] = [];

        if (Array.isArray(json)) {
          subjectsArray = json;
        } else if (json && typeof json === 'object') {
          const payload = json as Record<string, unknown>;
          if (Array.isArray(payload.data)) {
            subjectsArray = payload.data as Subject[];
          } else if (Array.isArray(payload.subjects)) {
            subjectsArray = payload.subjects as Subject[];
          }
        }

        return {
          success: true,
          data: subjectsArray,
        };
      }

      return {
        success: false,
        error: getErrorMessage(json, response.status),
      };
    } catch (error) {
      console.error('[subjectsHttpService.getSubjectsByProfile] Error de red:', error);
      return {
        success: false,
        error: 'Error de conexión. Verifica tu conexión a internet.',
      };
    }
  },

  /**
   * Obtiene la información (id + nombre) de una materia mediante su ID.
   * Este endpoint se usa como respaldo cuando la materia no está en el perfil del usuario.
   */
  async getSubjectById(subjectId: string, token: string): Promise<ApiResponse<Subject>> {
    try {
      const response = await fetch(`${SUBJECTS_ENDPOINT}/${subjectId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          Pragma: 'no-cache',
        },
      });

      const json = await readJson(response);

      if (response.ok) {
        let subjectPayload: unknown = json;

        if (json && typeof json === 'object') {
          const payload = json as Record<string, unknown>;
          if (payload.data && typeof payload.data === 'object') {
            subjectPayload = payload.data;
          }
        }

        if (subjectPayload && typeof subjectPayload === 'object') {
          const payload = subjectPayload as Record<string, unknown>;
          const id =
            (typeof payload.id === 'string' ? payload.id : '') ||
            (typeof payload.subject_id === 'string' ? payload.subject_id : '') ||
            (typeof payload.subjectId === 'string' ? payload.subjectId : '');
          const name =
            (typeof payload.name === 'string' ? payload.name : '') ||
            (typeof payload.subject_name === 'string' ? payload.subject_name : '') ||
            (typeof payload.subjectName === 'string' ? payload.subjectName : '');

          if (id && name) {
            return {
              success: true,
              data: {
                id,
                name,
              },
            };
          }
        }

        return {
          success: false,
          error: 'No se encontró la materia.',
        };
      }

      return {
        success: false,
        error: getErrorMessage(json, response.status),
      };
    } catch (error) {
      console.error('[subjectsHttpService.getSubjectById] Error de red:', error);
      return {
        success: false,
        error: 'Error de conexión. Verifica tu conexión a internet.',
      };
    }
  },
};
