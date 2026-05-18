import { useCallback, useEffect, useState } from 'react';
import { useAuthStore } from '@shared/store/authStore';
import { searchHttpService } from '../../infrastructure/searchHttpService';
import type { SearchSubject } from '../../domain/search';

export function useSubjectSearch() {
  const token = useAuthStore((s) => s.token);
  const userId = useAuthStore((s) => s.userId);

  const [subjects, setSubjects] = useState<SearchSubject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<SearchSubject | null>(null);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [subjectsError, setSubjectsError] = useState<string | null>(null);

  const loadSubjects = useCallback(async () => {
    if (!userId || !token) {
      setSubjectsError('Sesión no válida. Recarga la página.');
      return;
    }
    setLoadingSubjects(true);
    setSubjectsError(null);
    const result = await searchHttpService.getSubjectsByProfile(userId, token);
    if (result.success && result.data) {
      setSubjects(result.data);
    } else {
      setSubjectsError(result.error ?? 'No se pudieron cargar las materias.');
    }
    setLoadingSubjects(false);
  }, [userId, token]);

  const selectSubject = useCallback((subject: SearchSubject) => {
    setSelectedSubject(subject);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedSubject(null);
  }, []);

  useEffect(() => {
    void loadSubjects();
  }, [loadSubjects]);

  return { subjects, selectedSubject, loadingSubjects, subjectsError, selectSubject, clearSelection, loadSubjects };
}
