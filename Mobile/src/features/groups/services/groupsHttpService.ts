/**
 * Servicio HTTP para Grupos de Estudio
 * Responsabilidad: Comunicación HTTP con el backend de grupos
 */

import { API_BASE_URL } from '@/src/config/api';
import type {
    ApiResponse,
    CreateGroupResponse,
    StudyGroup,
    StudyGroupCreatePayload,
} from '../types/groups';

const GROUPS_ENDPOINT = `${API_BASE_URL}/study-groups`;

/**
 * Lee JSON de forma segura desde una respuesta HTTP
 */
const readJson = async (response: Response): Promise<unknown> => {
  try {
    return await response.json();
  } catch {
    return null;
  }
};

/**
 * Obtiene mensaje de error de la respuesta del backend
 */
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

const toStringSafe = (value: unknown): string => {
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number') {
    return String(value);
  }
  return '';
};

/**
 * Envuelve una petición HTTP con manejo automático de errores de red y JSON parsing.
 * Elimina duplicación de try-catch en múltiples métodos.
 */
const executeFetch = async (
  fetcher: () => Promise<Response>
): Promise<{ ok: boolean; json: unknown; status: number }> => {
  try {
    const response = await fetcher();
    const json = await readJson(response);
    return { ok: response.ok, json, status: response.status };
  } catch (error) {
    console.error('[groupsHttpService] Network error:', error);
    return { ok: false, json: null, status: 0 };
  }
};

const toNumberSafe = (value: unknown): number | undefined => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
};

const toBooleanSafe = (value: unknown): boolean => {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true') return true;
    if (normalized === 'false') return false;
  }
  if (typeof value === 'number') {
    return value !== 0;
  }
  return false;
};

const resolveSubject = (rawGroup: Record<string, unknown>) => {
  const rawSubject = rawGroup.subject;

  if (rawSubject && typeof rawSubject === 'object') {
    const subjectObj = rawSubject as Record<string, unknown>;
    const id = toStringSafe(subjectObj.id);
    const name = toStringSafe(subjectObj.name);

    if (name) {
      return { id, name };
    }
  }

  const subjectName =
    toStringSafe(rawGroup.subject_name) ||
    toStringSafe(rawGroup.subjectName) ||
    toStringSafe(rawGroup.materia_nombre) ||
    toStringSafe(rawGroup.materiaName);

  if (subjectName) {
    return {
      id: toStringSafe(rawGroup.subject_id) || toStringSafe(rawGroup.subjectId),
      name: subjectName,
    };
  }

  return undefined;
};

const normalizeGroup = (raw: unknown): StudyGroup => {
  const rawGroup = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};

  return {
    id: toStringSafe(rawGroup.id),
    name: toStringSafe(rawGroup.name),
    description: toStringSafe(rawGroup.description),
    subject_id: toStringSafe(rawGroup.subject_id) || toStringSafe(rawGroup.subjectId),
    subject: resolveSubject(rawGroup),
    category: rawGroup.category as StudyGroup['category'],
    creator_id:
      toStringSafe(rawGroup.creator_id) ||
      toStringSafe(rawGroup.creatorId) ||
      toStringSafe(rawGroup.created_by) ||
      toStringSafe(rawGroup.createdBy),
    created_at: toStringSafe(rawGroup.created_at) || toStringSafe(rawGroup.createdAt),
    updated_at: toStringSafe(rawGroup.updated_at) || toStringSafe(rawGroup.updatedAt) || undefined,
    member_count:
      toNumberSafe(rawGroup.member_count) ??
      toNumberSafe(rawGroup.memberCount) ??
      toNumberSafe(rawGroup.members_count),
    is_member: toBooleanSafe(rawGroup.is_member ?? rawGroup.isMember),
    is_admin: toBooleanSafe(rawGroup.is_admin ?? rawGroup.isAdmin),
  };
};

const logGroupNormalization = (scope: 'getGroup' | 'getUserGroups', raw: unknown, normalized: StudyGroup) => {
  if (!__DEV__) {
    return;
  }

  console.log(`[groupsHttpService.${scope}] Raw group payload:`, raw);
  console.log(`[groupsHttpService.${scope}] Normalized subject:`, {
    groupId: normalized.id,
    subject_id: normalized.subject_id,
    subject: normalized.subject,
  });
};

export const groupsHttpService = {
  /**
   * Crea un nuevo grupo de estudio
   */
  async createGroup(
    payload: StudyGroupCreatePayload,
    token: string
  ): Promise<ApiResponse<CreateGroupResponse>> {
    const result = await executeFetch(() =>
      fetch(GROUPS_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })
    );

    if (!result.ok) {
      return {
        success: false,
        error:
          result.status === 0
            ? 'Error de conexión. Verifica tu conexión a internet.'
            : getErrorMessage(result.json, result.status),
      };
    }

    return {
      success: true,
      data: result.json as CreateGroupResponse,
    };
  },

  /**
   * Obtiene un grupo específico por ID
   */
  async getGroup(id: string, token: string): Promise<ApiResponse<StudyGroup>> {
    const result = await executeFetch(() =>
      fetch(`${GROUPS_ENDPOINT}/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      })
    );

    if (!result.ok) {
      return {
        success: false,
        error:
          result.status === 0
            ? 'Error de conexión. Verifica tu conexión a internet.'
            : getErrorMessage(result.json, result.status),
      };
    }

    let groupPayload: unknown = result.json;

    if (result.json && typeof result.json === 'object') {
      const payload = result.json as Record<string, unknown>;
      if (payload.data && typeof payload.data === 'object') {
        groupPayload = payload.data;
      }
    }

    const normalizedGroup = normalizeGroup(groupPayload);
    logGroupNormalization('getGroup', groupPayload, normalizedGroup);

    return {
      success: true,
      data: normalizedGroup,
    };
  },

  /**
   * Obtiene grupos del usuario (creados o participante)
   */
  async getUserGroups(token: string): Promise<ApiResponse<StudyGroup[]>> {
    const result = await executeFetch(() =>
      fetch(`${GROUPS_ENDPOINT}/my-groups`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      })
    );

    if (!result.ok) {
      return {
        success: false,
        error:
          result.status === 0
            ? 'Error de conexión. Verifica tu conexión a internet.'
            : getErrorMessage(result.json, result.status),
      };
    }

    let groupsArrayRaw: unknown[] = [];

    if (Array.isArray(result.json)) {
      groupsArrayRaw = result.json;
    } else if (result.json && typeof result.json === 'object') {
      const payload = result.json as Record<string, unknown>;
      if (Array.isArray(payload.data)) {
        groupsArrayRaw = payload.data;
      } else if (Array.isArray(payload.groups)) {
        groupsArrayRaw = payload.groups;
      }
    }

    const groupsArray = groupsArrayRaw.map(normalizeGroup);

    if (__DEV__) {
      console.log('[groupsHttpService.getUserGroups] Raw groups payload:', groupsArrayRaw);
      console.log(
        '[groupsHttpService.getUserGroups] Normalized subjects:',
        groupsArray.map((group) => ({
          groupId: group.id,
          subject_id: group.subject_id,
          subject: group.subject,
        }))
      );
    }

    return {
      success: true,
      data: groupsArray,
    };
  },

  /**
   * Obtiene grupos disponibles por materia
   * GET /api/study-groups/by-subject/:subjectId
   */
  async getAvailableGroupsBySubject(
    subjectId: string,
    token: string
  ): Promise<ApiResponse<StudyGroup[]>> {
    const result = await executeFetch(() =>
      fetch(`${GROUPS_ENDPOINT}/by-subject/${subjectId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      })
    );

    if (!result.ok) {
      return {
        success: false,
        error:
          result.status === 0
            ? 'Error de conexión. Verifica tu conexión a internet.'
            : getErrorMessage(result.json, result.status),
      };
    }

    let groupsArrayRaw: unknown[] = [];

    if (Array.isArray(result.json)) {
      groupsArrayRaw = result.json;
    } else if (result.json && typeof result.json === 'object') {
      const payload = result.json as Record<string, unknown>;
      if (Array.isArray(payload.data)) {
        groupsArrayRaw = payload.data;
      } else if (Array.isArray(payload.groups)) {
        groupsArrayRaw = payload.groups;
      }
    }

    return {
      success: true,
      data: groupsArrayRaw.map(normalizeGroup),
    };
  },

  /**
   * Únete a un grupo de estudio
   * POST /api/study-groups/:groupId/join
   */
  async joinGroup(groupId: string, token: string): Promise<ApiResponse<StudyGroup>> {
    const url = `${GROUPS_ENDPOINT}/${groupId}/join`;

    if (__DEV__) {
      console.log('[groupsHttpService.joinGroup] POST', url, 'token length', token?.length ?? 0);
    }

    const result = await executeFetch(() =>
      fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      })
    );

    if (__DEV__) {
      console.log('[groupsHttpService.joinGroup] response status', result.status, 'ok', result.ok);
      console.log('[groupsHttpService.joinGroup] response json', result.json);
    }

    if (!result.ok) {
      return {
        success: false,
        error:
          result.status === 0
            ? 'Error de conexión. Verifica tu conexión a internet.'
            : getErrorMessage(result.json, result.status),
      };
    }

    let groupPayload: unknown = result.json;

    if (result.json && typeof result.json === 'object') {
      const payload = result.json as Record<string, unknown>;
      if (payload.data && typeof payload.data === 'object') {
        groupPayload = payload.data;
      }
    }

    const normalizedGroup = normalizeGroup(groupPayload);
    if (__DEV__) {
      console.log('[groupsHttpService.joinGroup] Joined group:', normalizedGroup);
    }

    return {
      success: true,
      data: normalizedGroup,
    };
  },

  /**
   * Salirse de un grupo de estudio
   * POST /api/study-groups/:groupId/leave
   */
  async leaveGroup(groupId: string, token: string): Promise<ApiResponse<StudyGroup>> {
    const url = `${GROUPS_ENDPOINT}/${groupId}/leave`;

    if (__DEV__) {
      console.log('[groupsHttpService.leaveGroup] POST', url, 'token length', token?.length ?? 0);
    }

    const result = await executeFetch(() =>
      fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      })
    );

    if (__DEV__) {
      console.log('[groupsHttpService.leaveGroup] response status', result.status, 'ok', result.ok);
      console.log('[groupsHttpService.leaveGroup] response json', result.json);
    }

    if (!result.ok) {
      return {
        success: false,
        error:
          result.status === 0
            ? 'Error de conexión. Verifica tu conexión a internet.'
            : getErrorMessage(result.json, result.status),
      };
    }

    let groupPayload: unknown = result.json;

    if (result.json && typeof result.json === 'object') {
      const payload = result.json as Record<string, unknown>;
      if (payload.data && typeof payload.data === 'object') {
        groupPayload = payload.data;
      }
    }

    const normalizedGroup = normalizeGroup(groupPayload);
    if (__DEV__) {
      console.log('[groupsHttpService.leaveGroup] Left group:', normalizedGroup);
    }

    return {
      success: true,
      data: normalizedGroup,
    };
  },
};
