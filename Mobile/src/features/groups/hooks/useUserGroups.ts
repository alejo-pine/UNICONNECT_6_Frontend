/**
 * Hook para obtener la lista de grupos del usuario
 */

import { useAuthStore } from '@/src/store/authStore';
import * as SecureStore from 'expo-secure-store';
import { useCallback, useEffect, useRef, useState } from 'react';
import { groupsHttpService } from '../services/groupsHttpService';
import { subjectsHttpService } from '../services/subjectsHttpService';
import type { StudyGroup } from '../types/groups';

interface UseUserGroupsReturn {
  adminGroups: StudyGroup[];
  participantGroups: StudyGroup[];
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
}

const SUBJECT_NAME_CACHE_KEY = 'subject_name_cache';

export const useUserGroups = (): UseUserGroupsReturn => {
  const { token, userId } = useAuthStore();
  const [allGroups, setAllGroups] = useState<StudyGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Cache de nombres de materias usados en grupos para mantenerlos incluso si el
  // usuario elimina la materia de su perfil.
  const subjectNameCacheRef = useRef<Map<string, string>>(new Map());
  const cacheLoadedRef = useRef(false);

  const loadSubjectNameCache = useCallback(async () => {
    if (cacheLoadedRef.current) return;

    try {
      const cached = await SecureStore.getItemAsync(SUBJECT_NAME_CACHE_KEY);
      if (!cached) {
        cacheLoadedRef.current = true;
        return;
      }
      const parsed = JSON.parse(cached) as Record<string, string>;
      subjectNameCacheRef.current = new Map(Object.entries(parsed));
    } catch (error) {
      console.warn('[useUserGroups] No se pudo cargar cache de materias:', error);
    } finally {
      cacheLoadedRef.current = true;
    }
  }, []);

  const persistSubjectNameCache = useCallback(async () => {
    try {
      await SecureStore.setItemAsync(
        SUBJECT_NAME_CACHE_KEY,
        JSON.stringify(Object.fromEntries(subjectNameCacheRef.current))
      );
    } catch (error) {
      console.warn('[useUserGroups] No se pudo guardar cache de materias:', error);
    }
  }, []);

  const reload = useCallback(async () => {
    if (!token) {
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

    try {
      // Cargar cache local de nombres de materias (para mantenerlas aunque se eliminen del perfil)
      await loadSubjectNameCache();

      const [groupsResponse, subjectsResponse] = await Promise.all([
        groupsHttpService.getUserGroups(token),
        userId
          ? subjectsHttpService.getSubjectsByProfile(userId, token)
          : subjectsHttpService.getUserSubjects(token),
      ]);

      const profileSubjects = subjectsResponse.success && subjectsResponse.data ? subjectsResponse.data : [];

      // Merge cached subject names (from previously loaded groups) + current profile subjects.
      // Profile subjects take precedence since pueden haber sido renombradas.
      const subjectNameMap = new Map(subjectNameCacheRef.current);
      profileSubjects.forEach((subject) => {
        subjectNameMap.set(String(subject.id), subject.name);
      });

      // Si aún faltan nombres de materias, intentar obtenerlos por ID desde el backend.
      const missingSubjectIds = new Set<string>();
      if (groupsResponse.success && groupsResponse.data) {
        groupsResponse.data.forEach((group) => {
          if (!group.subject?.name && group.subject_id) {
            const key = String(group.subject_id);
            if (!subjectNameMap.has(key)) {
              missingSubjectIds.add(key);
            }
          }
        });
      }

      if (missingSubjectIds.size > 0) {
        await Promise.all(
          Array.from(missingSubjectIds).map(async (subjectId) => {
            try {
              const subjectResponse = await subjectsHttpService.getSubjectById(subjectId, token);
              if (subjectResponse.success && subjectResponse.data?.name) {
                subjectNameMap.set(subjectId, subjectResponse.data.name);
              }
            } catch {
              // ignore errors; no será crítico si no logramos resolver el nombre
            }
          })
        );
      }

      if (__DEV__) {
        console.log('[useUserGroups] subjectNameMap:', Object.fromEntries(subjectNameMap));
      }

      if (groupsResponse.success && groupsResponse.data) {
        const enrichedGroups = groupsResponse.data.map((group) => {
          // Si el grupo ya incluye el nombre de la materia, lo preservamos y lo cacheamos.
          if (group.subject?.name) {
            if (group.subject.id) {
              subjectNameCacheRef.current.set(String(group.subject.id), group.subject.name);
            }
            return group;
          }

          const resolvedName = subjectNameMap.get(String(group.subject_id));
          if (!resolvedName) {
            return group;
          }

          // Cacheamos el nombre para mantenerlo cuando el usuario elimine la materia de su perfil.
          subjectNameCacheRef.current.set(String(group.subject_id), resolvedName);

          return {
            ...group,
            subject: {
              id: String(group.subject_id),
              name: resolvedName,
            },
          };
        });

        if (__DEV__) {
          console.log(
            '[useUserGroups] Enriched groups subjects:',
            enrichedGroups.map((group) => ({
              groupId: group.id,
              subject_id: group.subject_id,
              subject: group.subject,
            }))
          );
        }

        if (isMountedRef.current) {
          setAllGroups(enrichedGroups);
        }
        await persistSubjectNameCache();
      } else {
        if (isMountedRef.current) {
          setError(groupsResponse.error || 'Error desconocido');
          setAllGroups([]);
        }
      }
    } catch (err) {
      console.error('[useUserGroups] Error:', err);
      if (isMountedRef.current) {
        setError('Error al cargar los grupos');
        setAllGroups([]);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [token, userId, loadSubjectNameCache, persistSubjectNameCache]);

  // Ejecuta carga inicial y cada vez que cambian credenciales (vía reload memoizado)
  useEffect(() => {
    reload();
  }, [reload]);

  // Separar grupos: administrados vs participante
  const adminGroups = allGroups.filter((g) => g.is_admin);
  const participantGroups = allGroups.filter((g) => !g.is_admin);

  return { adminGroups, participantGroups, loading, error, reload };
};
