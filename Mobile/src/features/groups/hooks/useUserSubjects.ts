/**
 * Hook para cargar las materias del usuario autenticado
 * Obtiene datos del endpoint: GET /api/subjects/my-subjects
 */

import { useAuthStore } from '@/src/store/authStore';
import { useCallback, useEffect, useState } from 'react';
import type { Subject } from '../services/subjectsHttpService';
import { subjectsHttpService } from '../services/subjectsHttpService';

interface UseUserSubjectsReturn {
  subjects: Subject[];
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
}

export const useUserSubjects = (): UseUserSubjectsReturn => {
  const { token } = useAuthStore();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!token) {
      console.warn('[useUserSubjects] No hay token disponible');
      setError('Se requieren credenciales válidas');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('[useUserSubjects] Iniciando fetch de materias del usuario...');
      const response = await subjectsHttpService.getUserSubjects(token);

      console.log('[useUserSubjects] Response:', { success: response.success, dataLength: response.data?.length, error: response.error });

      if (response.success && response.data) {
        console.log('[useUserSubjects] Materias cargadas correctamente:', response.data);
        setSubjects(response.data);
        setError(null);
      } else {
        const errorMsg = response.error || 'Error desconocido';
        console.error('[useUserSubjects] Error:', errorMsg);
        setError(errorMsg);
        setSubjects([]);
      }
    } catch (err) {
      console.error('[useUserSubjects] Excepción capturada:', err);
      setError('Error al cargar las materias');
      setSubjects([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { subjects, loading, error, reload };
};
