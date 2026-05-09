/**
 * Hook para obtener el detalle de un grupo de estudio
 */

import { useAuthStore } from '@/src/store/authStore';
import * as SecureStore from 'expo-secure-store';
import { useCallback, useEffect, useRef, useState } from 'react';
import { groupsHttpService } from '../services/groupsHttpService';
import { subjectsHttpService } from '../services/subjectsHttpService';
import type { StudyGroup } from '../types/groups';

const SUBJECT_NAME_CACHE_KEY = 'subject_name_cache';

interface UseGroupDetailReturn {
  group: StudyGroup | null;
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
  joinGroup: () => Promise<{ success: boolean; error?: string }>;
  leaveGroup: () => Promise<{ success: boolean; error?: string }>;
}

export const useGroupDetail = (groupId: string): UseGroupDetailReturn => {
  const { token } = useAuthStore();
  const [group, setGroup] = useState<StudyGroup | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Cache local de nombres de materias para mostrar nombres incluso si el usuario elimina la materia
  // de su lista de "Mis materias".
  const subjectNameCacheRef = useRef<Map<string, string>>(new Map());
  const cacheLoadedRef = useRef(false);

  const loadCache = useCallback(async () => {
    if (cacheLoadedRef.current) return;

    try {
      const cached = await SecureStore.getItemAsync(SUBJECT_NAME_CACHE_KEY);
      if (!cached) {
        cacheLoadedRef.current = true;
        return;
      }

      const parsed = JSON.parse(cached) as Record<string, string>;
      Object.entries(parsed).forEach(([key, value]) => {
        if (typeof value === 'string' && value.trim().length > 0) {
          subjectNameCacheRef.current.set(key, value);
        }
      });
    } catch (err) {
      console.warn('[useGroupDetail] No se pudo cargar cache de materias:', err);
    } finally {
      cacheLoadedRef.current = true;
    }
  }, []);

  const persistCache = useCallback(async () => {
    try {
      await SecureStore.setItemAsync(
        SUBJECT_NAME_CACHE_KEY,
        JSON.stringify(Object.fromEntries(subjectNameCacheRef.current))
      );
    } catch (err) {
      console.warn('[useGroupDetail] No se pudo guardar cache de materias:', err);
    }
  }, []);

  const reload = useCallback(async () => {
    if (!token || !groupId) {
      if (isMountedRef.current) {
        setError('Se requieren credenciales válidas');
        setLoading(false);
      }
      return;
    }

    if (isMountedRef.current) {
      setLoading(true);
      setError(null);
    }

    await loadCache();

    const subjectNameCache = subjectNameCacheRef.current;

    try {
      const response = await groupsHttpService.getGroup(groupId, token);
      const groupData = response.data;

      if (response.success && groupData) {
        let enrichedGroup = groupData;

        const subjectId = String(groupData.subject_id ?? '');
        const existingName = groupData.subject?.name?.trim();

        if (subjectId && existingName) {
          subjectNameCache.set(subjectId, existingName);
        }

        let resolvedName = existingName;

        if (!resolvedName && subjectId) {
          // 1) Intentar resolver desde cache local
          resolvedName = subjectNameCache.get(subjectId);
        }

        if (!resolvedName && subjectId) {
          // 2) Intentar resolver desde backend usando id de materia
          const subjectResponse = await subjectsHttpService.getSubjectById(subjectId, token);
          if (subjectResponse.success && subjectResponse.data?.name) {
            resolvedName = subjectResponse.data.name;
            subjectNameCache.set(subjectId, resolvedName);
          }
        }

        if (!resolvedName && subjectId) {
          // 3) Fallback (menos probable): buscar en materias actuales del usuario
          const subjectsResponse = await subjectsHttpService.getUserSubjects(token);
          if (subjectsResponse.success && subjectsResponse.data) {
            const matchedSubject = subjectsResponse.data.find(
              (subject) => String(subject.id) === subjectId
            );
            if (matchedSubject) {
              resolvedName = matchedSubject.name;
              subjectNameCache.set(subjectId, resolvedName);
            }
          }
        }

        if (subjectId && resolvedName) {
          enrichedGroup = {
            ...groupData,
            subject: {
              id: subjectId,
              name: resolvedName,
            },
          };
        }

        await persistCache();

        if (__DEV__) {
          console.log('[useGroupDetail] Final subject for detail:', {
            groupId: enrichedGroup.id,
            subject_id: enrichedGroup.subject_id,
            subject: enrichedGroup.subject,
          });
        }

        if (isMountedRef.current) {
          setGroup(enrichedGroup);
        }
      } else {
        if (isMountedRef.current) {
          setError(response.error || 'Error desconocido');
          setGroup(null);
        }
      }
    } catch (err) {
      console.error('[useGroupDetail] Error:', err);
      if (isMountedRef.current) {
        setError('Error al cargar el grupo');
        setGroup(null);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [groupId, token, loadCache, persistCache]);

  // Ejecuta carga inicial y al cambiar groupId/token (vía reload memoizado)
  useEffect(() => {
    reload();
  }, [reload]);

  const joinGroup = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    if (!token || !groupId) {
      return { success: false, error: 'Se requieren credenciales válidas' };
    }

    try {
      if (isMountedRef.current) {
        setLoading(true);
        setError(null);
      }

      const response = await groupsHttpService.joinGroup(groupId, token);
      if (!response.success) {
        if (isMountedRef.current) {
          setError(response.error || 'No se pudo unir al grupo');
        }
        return { success: false, error: response.error };
      }

      // Re-cargar el grupo para asegurar que los flags y miembros estén sincronizados
      await reload();

      return { success: true };
    } catch (err) {
      console.error('[useGroupDetail] Error joining group:', err);
      if (isMountedRef.current) {
        setError('No se pudo unir al grupo');
      }
      return { success: false, error: 'No se pudo unir al grupo' };
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [groupId, reload, token]);

  const leaveGroup = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    if (!token || !groupId) {
      return { success: false, error: 'Se requieren credenciales válidas' };
    }

    try {
      if (isMountedRef.current) {
        setLoading(true);
        setError(null);
      }

      const response = await groupsHttpService.leaveGroup(groupId, token);
      if (!response.success) {
        if (isMountedRef.current) {
          setError(response.error || 'No se pudo salir del grupo');
        }
        return { success: false, error: response.error };
      }

      // Re-cargar el grupo para asegurar que los flags y miembros estén sincronizados
      await reload();

      return { success: true };
    } catch (err) {
      console.error('[useGroupDetail] Error leaving group:', err);
      if (isMountedRef.current) {
        setError('No se pudo salir del grupo');
      }
      return { success: false, error: 'No se pudo salir del grupo' };
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [groupId, reload, token]);

  return { group, loading, error, reload, joinGroup, leaveGroup };
};
