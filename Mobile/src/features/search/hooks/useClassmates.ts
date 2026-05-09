/**
 * Hook para buscar compañeros por materia (US-005).
 * Gestiona el ciclo de vida de la búsqueda mediante SearchStatus.
 */
import { useCallback, useState } from "react";
import { useAuthStore } from "../../../store/authStore";
import { getErrorMessage, parseError } from "../../../utils/errorHandler";
import { searchHttpService } from "../services/searchHttpService";
import type { Classmate, SearchStatus } from "../types/search";

interface UseClassmatesReturn {
  classmates: Classmate[];
  status: SearchStatus;
  error: string | null;
  searchClassmates: (subjectId: string) => Promise<void>;
  reset: () => void;
}

export const useClassmates = (): UseClassmatesReturn => {
  const { token } = useAuthStore();

  const [classmates, setClassmates] = useState<Classmate[]>([]);
  const [status, setStatus] = useState<SearchStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const searchClassmates = useCallback(
    async (subjectId: string) => {
      if (!token) {
        setError("Sesión no válida. Reinicia la aplicación.");
        setStatus("error");
        return;
      }

      setStatus("loading");
      setError(null);
      setClassmates([]);

      try {
        const result = await searchHttpService.getClassmatesBySubject(
          subjectId,
          token,
        );

        if (result.success && result.data) {
          if (result.data.length === 0) {
            setStatus("empty");
          } else {
            setClassmates(result.data);
            setStatus("success");
          }
        } else {
          const appError = parseError({ message: result.error });
          setError(getErrorMessage(appError));
          setStatus("error");
        }
      } catch (err) {
        const appError = parseError(err);
        setError(getErrorMessage(appError));
        setStatus("error");
      }
    },
    [token],
  );

  const reset = useCallback(() => {
    setClassmates([]);
    setStatus("idle");
    setError(null);
  }, []);

  return { classmates, status, error, searchClassmates, reset };
};
