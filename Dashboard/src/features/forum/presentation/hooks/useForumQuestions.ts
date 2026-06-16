import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuthStore } from '@shared/store/authStore';
import type { ForumQuestion } from '../../domain/forum';
import { forumHttpService } from '../../infrastructure/forumHttpService';

const POLL_INTERVAL_MS = 12000;

type QuestionsStatus = 'idle' | 'loading' | 'success' | 'empty' | 'error' | 'forbidden';

interface UseForumQuestionsReturn {
  questions: ForumQuestion[];
  status: QuestionsStatus;
  error: string | null;
  reload: () => Promise<void>;
}

export const useForumQuestions = (subjectId: string): UseForumQuestionsReturn => {
  const token = useAuthStore((state) => state.token);
  const [questions, setQuestions] = useState<ForumQuestion[]>([]);
  const [status, setStatus] = useState<QuestionsStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const fetchingRef = useRef(false);

  const reload = useCallback(async (silent = false) => {
    if (!token || !subjectId || fetchingRef.current) return;
    fetchingRef.current = true;
    if (!silent) setStatus('loading');
    setError(null);

    const response = await forumHttpService.getQuestions(subjectId, token);
    fetchingRef.current = false;

    if (response.isForbidden) {
      setStatus('forbidden');
      setError(response.error ?? 'Acceso denegado');
      return;
    }
    if (!response.success || !response.data) {
      if (!silent) { setStatus('error'); setError(response.error ?? 'Error al cargar las preguntas'); }
      return;
    }
    setQuestions(response.data);
    setStatus(response.data.length === 0 ? 'empty' : 'success');
  }, [token, subjectId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    const id = setInterval(() => void reload(true), POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [reload]);

  return { questions, status, error, reload };
};
