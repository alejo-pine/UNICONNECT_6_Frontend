/**
 * Hook para guardar cambios de materias
 * Soluciona: Manejo de errores centralizado, lógica en componente
 */
import { useCallback, useState } from 'react';
import { profileHttpService } from '../../../services/profileHttpService';
import { useAuthStore } from '../../../store/authStore';
import { getErrorMessage, parseError } from '../../../utils/errorHandler';
import { Subject } from './useSubjectsManager';

interface UseSubjectsSaveReturn {
  saving: boolean;
  error: string | null;
  saveSubjects: (subjects: Subject[]) => Promise<boolean>;
  clearError: () => void;
}

export const useSubjectsSave = (): UseSubjectsSaveReturn => {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { token, userId } = useAuthStore();

  const saveSubjects = useCallback(async (subjects: Subject[]): Promise<boolean> => {
    if (!token || !userId) {
      const errorMsg = 'Sesion no disponible. Inicia sesion nuevamente.';
      setError(errorMsg);
      return false;
    }

    setSaving(true);
    setError(null);

    try {
      const subjectIds = subjects.map((s) => s.id);
      const response = await profileHttpService.updateProfileSubjects(
        userId,
        subjectIds,
        token
      );

      if (!response.success) {
        const appError = parseError({ message: response.error });
        const errorMessage = getErrorMessage(appError);
        setError(errorMessage);
        return false;
      }

      return true;
    } catch (err) {
      const appError = parseError(err);
      const errorMessage = getErrorMessage(appError);
      setError(errorMessage);
      return false;
    } finally {
      setSaving(false);
    }
  }, [token, userId]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return { saving, error, saveSubjects, clearError };
};
