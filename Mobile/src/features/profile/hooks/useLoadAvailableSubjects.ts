/**
 * Hook para cargar todas las materias disponibles desde el backend
 * Soluciona: Lógica en componente, useEffect mal usado
 */
import { useCallback, useEffect, useState } from 'react';
import { Subject, profileHttpService } from '../../../services/profileHttpService';
import { getErrorMessage, parseError } from '../../../utils/errorHandler';

interface UseLoadAvailableSubjectsOptions {
  career?: string;
  program?: string;
  search?: string;
  limit?: number;
}

interface UseLoadAvailableSubjectsReturn {
  subjects: Subject[];
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
}

export const useLoadAvailableSubjects = (
  token: string,
  options: UseLoadAvailableSubjectsOptions = {}
): UseLoadAvailableSubjectsReturn => {
  const career = options.career;
  const program = options.program;
  const search = options.search;
  const limit = options.limit;

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!token) {
      const msg = 'Falta token de autenticación';
      setError(msg);
      console.warn('[useLoadAvailableSubjects]', msg);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('[useLoadAvailableSubjects] Cargando materias disponibles...');
      const response = await profileHttpService.getAvailableSubjects(token, {
        career,
        program,
        search,
        limit,
      });

      if (response.success && response.data) {
        console.log('[useLoadAvailableSubjects] Materias disponibles cargadas:', response.data);
        setSubjects(response.data);
      } else {
        const errorMsg = response.error || 'Error desconocido al cargar materias disponibles';
        console.error('[useLoadAvailableSubjects] Error:', errorMsg);
        setError(errorMsg);
        setSubjects([]);
      }
    } catch (err) {
      console.error('[useLoadAvailableSubjects] Excepción:', err);
      const appError = parseError(err);
      const errorMessage = getErrorMessage(appError);
      setError(errorMessage);
      setSubjects([]);
    } finally {
      setLoading(false);
    }
  }, [
    career,
    limit,
    program,
    search,
    token,
  ]);

  // Cargar materias al montar el componente
  useEffect(() => {
    reload();
  }, [reload]);

  return { subjects, loading, error, reload };
};
