/**
 * Hook para obtener la lista de grupos del usuario con actualizaciones en tiempo real (Socket.IO)
 */

import { useAuthStore } from '@/src/store/authStore';
import * as SecureStore from 'expo-secure-store';
import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { io } from 'socket.io-client';
import { groupsHttpService } from '../services/groupsHttpService';
import { subjectsHttpService } from '../services/subjectsHttpService';
import type { StudyGroup } from '../types/groups';

interface StudyGroupRealtimePayload {
  groupId: string;
  members?: unknown[];
  pendingRequests?: unknown[];
}

interface AdminTransferRequestedPayload {
  groupId: string;
  fromUserId: string;
  toUserId: string;
}

const realtimeSocketUrl = process.env.BACKEND_PUBLIC_URL || 'http://10.0.2.2:3000';

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

interface UseUserGroupsOptions {
  onAdminTransferRequested?: (payload: AdminTransferRequestedPayload) => void;
}

interface UseUserGroupsReturn {
  adminGroups: StudyGroup[];
  participantGroups: StudyGroup[];
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
}

const SUBJECT_NAME_CACHE_KEY = 'subject_name_cache';

export const useUserGroups = (options: UseUserGroupsOptions = {}): UseUserGroupsReturn => {
  const { onAdminTransferRequested } = options;
  const { token, userId } = useAuthStore();
  const [allGroups, setAllGroups] = useState<StudyGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const isMountedRef = useRef(true);
  const groupsRef = useRef<StudyGroup[]>([]);
  const socketRef = useRef<any>(null);
  const onAdminTransferRequestedRef = useRef(onAdminTransferRequested);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    onAdminTransferRequestedRef.current = onAdminTransferRequested;
  }, [onAdminTransferRequested]);

  useEffect(() => {
    groupsRef.current = allGroups;
  }, [allGroups]);

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

  const preserveSubject = useCallback((incoming: StudyGroup, existing: StudyGroup): StudyGroup => {
    if (incoming.subject?.name) return incoming;
    if (existing.subject?.name) return { ...incoming, subject: existing.subject };
    return incoming;
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
      await loadSubjectNameCache();

      const [groupsResponse, subjectsResponse] = await Promise.all([
        groupsHttpService.getUserGroups(token),
        userId
          ? subjectsHttpService.getSubjectsByProfile(userId, token)
          : subjectsHttpService.getUserSubjects(token),
      ]);

      const profileSubjects = subjectsResponse.success && subjectsResponse.data ? subjectsResponse.data : [];
      const subjectNameMap = new Map(subjectNameCacheRef.current);
      profileSubjects.forEach((subject) => {
        subjectNameMap.set(String(subject.id), subject.name);
      });

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
              // ignore
            }
          })
        );
      }

      if (groupsResponse.success && groupsResponse.data) {
        const enrichedGroups = groupsResponse.data.map((group) => {
          if (group.subject?.name) {
            if (group.subject.id) {
              subjectNameCacheRef.current.set(String(group.subject.id), group.subject.name);
            }
            return group;
          }

          const resolvedName = subjectNameMap.get(String(group.subject_id));
          if (!resolvedName) return group;

          subjectNameCacheRef.current.set(String(group.subject_id), resolvedName);

          return {
            ...group,
            subject: {
              id: String(group.subject_id),
              name: resolvedName,
            },
          };
        });

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

  useEffect(() => {
    reload();
  }, [reload]);

  // SOCKET.IO REALTIME LOGIC (Ported from Dashboard Web)
  useEffect(() => {
    if (!token || !userId) return;

    const socket = io(realtimeSocketUrl, {
      auth: {
        'x-user-id': userId,
        Authorization: `Bearer ${token}`,
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    const joinKnownGroups = () => {
      for (const group of groupsRef.current) {
        socket.emit('study-group:join', { groupId: group.id });
      }
    };

    const handleStudyGroupUpdated = (payload: StudyGroupRealtimePayload) => {
      const hasMembers = Array.isArray(payload.members);
      const hasPending = Array.isArray(payload.pendingRequests);
      const nextMembers = hasMembers ? toUserIds(payload.members) : [];
      const nextPendingRequests = hasPending ? toUserIds(payload.pendingRequests) : [];

      setAllGroups((currentGroups) =>
        currentGroups.map((group) => {
          if (group.id !== payload.groupId) return group;
          return {
            ...group,
            members: hasMembers ? nextMembers : group.members,
            member_count: hasMembers ? nextMembers.length : group.member_count,
            pendingRequests: hasPending ? nextPendingRequests : group.pendingRequests,
          };
        })
      );

      // Re-sync with backend detail so local storage gets latest deep data
      void (async () => {
        const detailResponse = await groupsHttpService.getGroup(payload.groupId, token);
        if (!detailResponse.success || !detailResponse.data) return;
        const detailGroup = detailResponse.data;

        setAllGroups((currentGroups) =>
          currentGroups.map((group) => {
            if (group.id !== payload.groupId) return group;
            return preserveSubject(
              { ...group, ...detailGroup, is_admin: group.is_admin, is_member: group.is_member },
              group
            );
          })
        );
      })();
    };

    const handleAdminTransferRequested = (payload: AdminTransferRequestedPayload) => {
      if (payload.toUserId !== userId) return;
      onAdminTransferRequestedRef.current?.(payload);
    };

    socket.on('connect', joinKnownGroups);
    socket.on('study-group:updated', handleStudyGroupUpdated);
    socket.on('admin_transfer_requested', handleAdminTransferRequested);

    if (socket.connected) {
      joinKnownGroups();
    }

    return () => {
      for (const group of groupsRef.current) {
        socket.emit('study-group:leave', { groupId: group.id });
      }
      socket.off('connect', joinKnownGroups);
      socket.off('study-group:updated', handleStudyGroupUpdated);
      socket.off('admin_transfer_requested', handleAdminTransferRequested);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [userId, token, preserveSubject]);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;
    for (const group of allGroups) {
      socket.emit('study-group:join', { groupId: group.id });
    }
  }, [allGroups]);

  const adminGroups = useMemo(() => allGroups.filter((g) => g.is_admin), [allGroups]);
  const participantGroups = useMemo(() => allGroups.filter((g) => !g.is_admin), [allGroups]);

  return { adminGroups, participantGroups, loading, error, reload };
};
