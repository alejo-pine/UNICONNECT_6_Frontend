import { useCallback, useMemo, useState } from 'react';

import { useAuthStore } from '@/src/store/authStore';

import { groupsHttpService } from '../services/groupsHttpService';
import { subjectsHttpService, type Subject } from '../services/subjectsHttpService';
import type { GroupSearchStatus, StudyGroup } from '../types/groups';

interface UseSubjectGroupsSearchReturn {
  subjects: Subject[];
  selectedSubject: Subject | null;
  groups: StudyGroup[];
  loadingSubjects: boolean;
  subjectsError: string | null;
  status: GroupSearchStatus;
  error: string | null;
  loadSubjects: () => Promise<Subject[]>;
  selectSubject: (subject: Subject) => void;
  clearSelection: () => void;
  searchGroups: (subjectId: string) => Promise<void>;
  resetResults: () => void;
  joinGroup: (groupId: string) => Promise<boolean>;
  leaveGroup: (groupId: string) => Promise<boolean>;
}

export const useSubjectGroupsSearch = (): UseSubjectGroupsSearchReturn => {
  const { userId, token } = useAuthStore();

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [groups, setGroups] = useState<StudyGroup[]>([]);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [subjectsError, setSubjectsError] = useState<string | null>(null);
  const [status, setStatus] = useState<GroupSearchStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  const canRequest = useMemo(() => Boolean(userId && token), [userId, token]);

  const loadSubjects = useCallback(async (): Promise<Subject[]> => {
    if (!canRequest || !userId || !token) {
      setSubjectsError('Sesión no válida. Reinicia la aplicación.');
      setSubjects([]);
      return [];
    }

    setLoadingSubjects(true);
    setSubjectsError(null);

    try {
      const response = await subjectsHttpService.getSubjectsByProfile(userId, token);

      if (response.success && response.data) {
        setSubjects(response.data);
        return response.data;
      }

      setSubjects([]);
      setSubjectsError(response.error || 'No se pudieron cargar tus materias.');
      return [];
    } catch {
      setSubjects([]);
      setSubjectsError('No se pudieron cargar tus materias.');
      return [];
    } finally {
      setLoadingSubjects(false);
    }
  }, [canRequest, token, userId]);

  const selectSubject = useCallback((subject: Subject) => {
    setSelectedSubject(subject);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedSubject(null);
  }, []);

  const resetResults = useCallback(() => {
    setGroups([]);
    setError(null);
    setStatus('idle');
  }, []);

  const searchGroups = useCallback(
    async (subjectId: string) => {
      if (!token) {
        setStatus('error');
        setError('Sesión no válida. Reinicia la aplicación.');
        setGroups([]);
        return;
      }

      setStatus('loading');
      setError(null);

      try {
        const response = await groupsHttpService.getAvailableGroupsBySubject(subjectId, token);

        if (!response.success) {
          setStatus('error');
          setError(response.error || 'No se pudieron cargar los grupos.');
          setGroups([]);
          return;
        }

        const data = response.data ?? [];
        setGroups(data);
        setStatus(data.length > 0 ? 'success' : 'empty');
      } catch {
        setStatus('error');
        setError('No se pudieron cargar los grupos.');
        setGroups([]);
      }
    },
    [token]
  );

  const joinGroup = useCallback(
    async (groupId: string): Promise<boolean> => {
      if (!token) {
        setError('Sesión no válida. Reinicia la aplicación.');
        return false;
      }

      try {
        const response = await groupsHttpService.joinGroup(groupId, token);
        if (!response.success || !response.data) {
          setError(response.error || 'No se pudo unir al grupo.');
          return false;
        }

        setGroups((prev) =>
          prev.map((group) =>
            group.id === groupId ? { ...group, ...response.data, is_member: true } : group
          )
        );

        return true;
      } catch {
        setError('No se pudo unir al grupo.');
        return false;
      }
    },
    [token]
  );

  const leaveGroup = useCallback(
    async (groupId: string): Promise<boolean> => {
      if (!token) {
        setError('Sesión no válida. Reinicia la aplicación.');
        return false;
      }

      try {
        const response = await groupsHttpService.leaveGroup(groupId, token);
        if (!response.success || !response.data) {
          setError(response.error || 'No se pudo salir del grupo.');
          return false;
        }

        setGroups((prev) =>
          prev.map((group) =>
            group.id === groupId ? { ...group, ...response.data, is_member: false } : group
          )
        );

        return true;
      } catch {
        setError('No se pudo salir del grupo.');
        return false;
      }
    },
    [token]
  );

  return {
    subjects,
    selectedSubject,
    groups,
    loadingSubjects,
    subjectsError,
    status,
    error,
    loadSubjects,
    selectSubject,
    clearSelection,
    searchGroups,
    resetResults,
    joinGroup,
    leaveGroup,
  };
};
