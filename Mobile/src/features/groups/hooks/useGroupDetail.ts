import { useAuthStore } from '@/src/store/authStore';
import { SOCKET_BASE_URL } from '@/src/config/api';
import * as SecureStore from 'expo-secure-store';
import { useCallback, useEffect, useRef, useState } from 'react';
import { groupsHttpService } from '../services/groupsHttpService';
import { subjectsHttpService } from '../services/subjectsHttpService';
import { profileHttpService } from '@/src/services/profileHttpService';
import type { StudyGroup } from '../types/groups';
import { io } from 'socket.io-client';

const realtimeSocketUrl = SOCKET_BASE_URL;

const toUserIds = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (typeof item === 'string') return item;
      if (typeof item === 'number') return String(item);
      if (item && typeof item === 'object') {
        const maybeUser = item as Record<string, unknown>;
        if (typeof maybeUser.id === 'string') return maybeUser.id;
        if (typeof maybeUser.userId === 'string') return maybeUser.userId;
        if (typeof maybeUser.user_id === 'string') return maybeUser.user_id;
        if (typeof maybeUser.profile_id === 'string') return maybeUser.profile_id;
      }
      return '';
    })
    .filter((id) => id.length > 0);
};

const SUBJECT_NAME_CACHE_KEY = 'subject_name_cache';

interface UseGroupDetailReturn {
  group: StudyGroup | null;
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
  joinGroup: () => Promise<{ success: boolean; error?: string }>;
  leaveGroup: () => Promise<{ success: boolean; error?: string }>;
  transferAdminAndLeave: (newAdminUserId: string) => Promise<{ success: boolean; error?: string }>;
  respondTransferAdmin: (action: 'accept' | 'reject') => Promise<{ success: boolean; error?: string }>;
  acceptRequest: (userId: string) => Promise<{ success: boolean; error?: string }>;
  rejectRequest: (userId: string) => Promise<{ success: boolean; error?: string }>;
  sessions: any[];
}

export const useGroupDetail = (groupId: string): UseGroupDetailReturn => {
  const { token } = useAuthStore();
  const [group, setGroup] = useState<StudyGroup | null>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = useRef(true);
  const socketRef = useRef<any>(null);

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
      const [response, sessionsResponse] = await Promise.all([
        groupsHttpService.getGroup(groupId, token),
        groupsHttpService.getStudySessions(groupId, token)
      ]);
      const groupData = response.data;
      if (sessionsResponse.success && isMountedRef.current) {
        setSessions(sessionsResponse.data || []);
      }

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
            ...enrichedGroup,
            subject: {
              id: subjectId,
              name: resolvedName,
            },
          };
        }

        // Fetch profiles for members
        if (enrichedGroup.members && enrichedGroup.members.length > 0) {
          const membersWithProfile = await Promise.all(
            enrichedGroup.members.map(async (member) => {
              if (member.name && member.name !== 'Estudiante') return member;
              const profileRes = await profileHttpService.getProfileById(member.id, token);
              if (profileRes.success && profileRes.data) {
                return {
                  ...member,
                  name: (profileRes.data as any).full_name ?? profileRes.data.name ?? member.name,
                  email: profileRes.data.email ?? member.email,
                  avatarUrl: profileRes.data.avatar_url ?? member.avatarUrl,
                };
              }
              return member;
            })
          );
          enrichedGroup.members = membersWithProfile;
        }

        // Fetch profiles for pendingRequests
        if (enrichedGroup.pendingRequests && enrichedGroup.pendingRequests.length > 0) {
          const pendingWithProfile = await Promise.all(
            enrichedGroup.pendingRequests.map(async (member) => {
              if (member.name && member.name !== 'Estudiante') return member;
              const profileRes = await profileHttpService.getProfileById(member.id, token);
              if (profileRes.success && profileRes.data) {
                return {
                  ...member,
                  name: (profileRes.data as any).full_name ?? profileRes.data.name ?? member.name,
                  email: profileRes.data.email ?? member.email,
                  avatarUrl: profileRes.data.avatar_url ?? member.avatarUrl,
                };
              }
              return member;
            })
          );
          enrichedGroup.pendingRequests = pendingWithProfile;
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

  useEffect(() => {
    if (!token || !groupId) return;

    const socket = io(realtimeSocketUrl, {
      auth: { Authorization: `Bearer ${token}` },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('study-group:join', { groupId });
    });

    socket.on('study-group:updated', (payload) => {
      if (payload.groupId === groupId) {
        const hasMembers = Array.isArray(payload.members);
        const nextMembers = hasMembers ? toUserIds(payload.members) : [];

        setGroup((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            members: hasMembers ? nextMembers.map(id => ({ id })) : prev.members,
            member_count: hasMembers ? nextMembers.length : prev.member_count,
          };
        });

        // Re-sync with backend to get any other new metadata
        void reload();
      }
    });

    const handleTransferEvent = (payload: { groupId: string }) => {
      if (payload.groupId === groupId) {
        void reload();
      }
    };

    socket.on('admin_transfer_requested', handleTransferEvent);
    socket.on('admin_transfer_accepted', handleTransferEvent);
    socket.on('admin_transfer_rejected', handleTransferEvent);

    if (socket.connected) {
      socket.emit('study-group:join', { groupId });
    }

    return () => {
      socket.emit('study-group:leave', { groupId });
      socket.disconnect();
      socketRef.current = null;
    };
  }, [groupId, token, reload]);

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



  const transferAdminAndLeave = useCallback(async (newAdminUserId: string): Promise<{ success: boolean; error?: string }> => {
    if (!token || !groupId) return { success: false, error: 'Se requieren credenciales válidas' };
    try {
      if (isMountedRef.current) { setLoading(true); setError(null); }
      const response = await groupsHttpService.transferAdminAndLeave(groupId, newAdminUserId, token);
      if (!response.success) {
        if (isMountedRef.current) setError(response.error || 'No se pudo transferir la administración');
        return { success: false, error: response.error };
      }
      return { success: true };
    } catch (err) {
      if (isMountedRef.current) setError('No se pudo transferir la administración');
      return { success: false, error: 'No se pudo transferir la administración' };
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  }, [groupId, token]);

  const respondTransferAdmin = useCallback(async (action: 'accept' | 'reject'): Promise<{ success: boolean; error?: string }> => {
    if (!token || !groupId) return { success: false, error: 'Se requieren credenciales válidas' };
    try {
      if (isMountedRef.current) { setLoading(true); setError(null); }
      const response = await groupsHttpService.respondTransferAdmin(groupId, action, token);
      if (!response.success) {
        if (isMountedRef.current) setError(response.error || 'No se pudo responder a la transferencia');
        return { success: false, error: response.error };
      }
      await reload();
      return { success: true };
    } catch (err) {
      if (isMountedRef.current) setError('No se pudo responder a la transferencia');
      return { success: false, error: 'No se pudo responder a la transferencia' };
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  }, [groupId, reload, token]);

  const acceptRequest = useCallback(async (userId: string): Promise<{ success: boolean; error?: string }> => {
    if (!token || !groupId) return { success: false, error: 'Se requieren credenciales válidas' };
    try {
      if (isMountedRef.current) { setLoading(true); setError(null); }
      const response = await groupsHttpService.acceptRequest(groupId, userId, token);
      if (!response.success) {
        if (isMountedRef.current) setError(response.error || 'No se pudo aceptar la solicitud');
        return { success: false, error: response.error };
      }
      await reload();
      return { success: true };
    } catch (err) {
      if (isMountedRef.current) setError('No se pudo aceptar la solicitud');
      return { success: false, error: 'No se pudo aceptar la solicitud' };
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  }, [groupId, reload, token]);

  const rejectRequest = useCallback(async (userId: string): Promise<{ success: boolean; error?: string }> => {
    if (!token || !groupId) return { success: false, error: 'Se requieren credenciales válidas' };
    try {
      if (isMountedRef.current) { setLoading(true); setError(null); }
      const response = await groupsHttpService.rejectRequest(groupId, userId, token);
      if (!response.success) {
        if (isMountedRef.current) setError(response.error || 'No se pudo rechazar la solicitud');
        return { success: false, error: response.error };
      }
      await reload();
      return { success: true };
    } catch (err) {
      if (isMountedRef.current) setError('No se pudo rechazar la solicitud');
      return { success: false, error: 'No se pudo rechazar la solicitud' };
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  }, [groupId, reload, token]);

  return {
    group,
    loading,
    error,
    reload,
    joinGroup,
    leaveGroup,
    transferAdminAndLeave,
    respondTransferAdmin,
    acceptRequest,
    rejectRequest,
    sessions,
  };
};
