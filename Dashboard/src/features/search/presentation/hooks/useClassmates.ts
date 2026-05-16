import { useCallback, useState } from 'react';
import { useAuthStore } from '@shared/store/authStore';
import { searchHttpService } from '../../infrastructure/searchHttpService';
import type { Classmate, SearchStatus } from '../../domain/search';

export function useClassmates() {
  const token = useAuthStore((s) => s.token);

  const [classmates, setClassmates] = useState<Classmate[]>([]);
  const [status, setStatus] = useState<SearchStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  const searchClassmates = useCallback(async (subjectId: string) => {
    if (!token) {
      setError('Sesión no válida. Recarga la página.');
      setStatus('error');
      return;
    }
    setStatus('loading');
    setError(null);
    setClassmates([]);

    const result = await searchHttpService.getClassmatesBySubject(subjectId, token);
    if (result.success && result.data) {
      if (result.data.length === 0) {
        setStatus('empty');
      } else {
        setClassmates(result.data);
        setStatus('success');
      }
    } else {
      setError(result.error ?? 'No se pudieron cargar los compañeros.');
      setStatus('error');
    }
  }, [token]);

  const reset = useCallback(() => {
    setClassmates([]);
    setStatus('idle');
    setError(null);
  }, []);

  return { classmates, status, error, searchClassmates, reset };
}
