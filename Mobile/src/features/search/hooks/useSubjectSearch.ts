/**
 * Hook para cargar y seleccionar la materia a buscar (US-005).
 * Abstrae la carga del listado y el estado de selección.
 */
import { useCallback, useEffect, useState } from "react";
import { useAuthStore } from "../../../store/authStore";
import { getErrorMessage, parseError } from "../../../utils/errorHandler";
import { searchHttpService } from "../services/searchHttpService";
import type { SearchSubject } from "../types/search";

interface UseSubjectSearchReturn {
  subjects: SearchSubject[];
  selectedSubject: SearchSubject | null;
  loadingSubjects: boolean;
  subjectsError: string | null;
  selectSubject: (subject: SearchSubject) => void;
  clearSelection: () => void;
  loadSubjects: () => Promise<void>;
}

export const useSubjectSearch = (): UseSubjectSearchReturn => {
  const { userId, token } = useAuthStore();

  const [subjects, setSubjects] = useState<SearchSubject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<SearchSubject | null>(
    null,
  );
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [subjectsError, setSubjectsError] = useState<string | null>(null);

  const loadSubjects = useCallback(async () => {
    if (!userId || !token) {
      setSubjectsError("Sesión no válida. Reinicia la aplicación.");
      return;
    }

    setLoadingSubjects(true);
    setSubjectsError(null);

    try {
      const result = await searchHttpService.getSubjectsByProfile(
        userId,
        token,
      );

      if (result.success && result.data) {
        setSubjects(result.data);
      } else {
        const appError = parseError({ message: result.error });
        setSubjectsError(getErrorMessage(appError));
      }
    } catch (err) {
      const appError = parseError(err);
      setSubjectsError(getErrorMessage(appError));
    } finally {
      setLoadingSubjects(false);
    }
  }, [userId, token]);

  const selectSubject = useCallback((subject: SearchSubject) => {
    setSelectedSubject(subject);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedSubject(null);
  }, []);

  // Se ejecuta al montar y cada vez que cambien las credenciales del store
  // (p.ej. cuando initializeFromEnv las carga después del primer render).
  useEffect(() => {
    loadSubjects();
  }, [loadSubjects]);

  return {
    subjects,
    selectedSubject,
    loadingSubjects,
    subjectsError,
    selectSubject,
    clearSelection,
    loadSubjects,
  };
};
