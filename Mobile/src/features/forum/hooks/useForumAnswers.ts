import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuthStore } from '@/src/store/authStore';
import type { ForumAnswer } from '../types/forum';
import { forumHttpService } from '../services/forumHttpService';

const POLL_INTERVAL_MS = 5000;

export type AnswersStatus = 'idle' | 'loading' | 'success' | 'empty' | 'error' | 'forbidden';

interface UseForumAnswersReturn {
  answers: ForumAnswer[];
  status: AnswersStatus;
  error: string | null;
  votingId: string | null;
  acceptingId: string | null;
  reload: () => Promise<void>;
  vote: (answerId: string) => Promise<void>;
  accept: (answerId: string, currentlyAccepted: boolean) => Promise<string | null>;
}

export const useForumAnswers = (questionId: string): UseForumAnswersReturn => {
  const { token } = useAuthStore();
  const [answers, setAnswers] = useState<ForumAnswer[]>([]);
  const [status, setStatus] = useState<AnswersStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [votingId, setVotingId] = useState<string | null>(null);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const fetchingRef = useRef(false);

  const reload = useCallback(async (silent = false) => {
    if (!token || !questionId || fetchingRef.current) return;
    fetchingRef.current = true;
    if (!silent) setStatus('loading');
    setError(null);

    const response = await forumHttpService.getAnswers(questionId, token);
    fetchingRef.current = false;

    if (response.isForbidden) {
      setStatus('forbidden');
      setError(response.error ?? 'Acceso denegado');
      return;
    }
    if (!response.success || !response.data) {
      if (!silent) { setStatus('error'); setError(response.error ?? 'Error al cargar las respuestas'); }
      return;
    }
    setAnswers(response.data);
    setStatus(response.data.length === 0 ? 'empty' : 'success');
  }, [token, questionId]);

  useEffect(() => {
    reload();
  }, [reload]);

  useEffect(() => {
    const id = setInterval(() => void reload(true), POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [reload]);

  const vote = useCallback(
    async (answerId: string) => {
      if (!token || votingId) return;
      setVotingId(answerId);

      // Optimistic update + client-side reorder (accepted first, then by votes desc)
      setAnswers((prev) => {
        const updated = prev.map((a) =>
          a.id === answerId
            ? { ...a, has_voted: !a.has_voted, vote_count: a.has_voted ? a.vote_count - 1 : a.vote_count + 1 }
            : a,
        );
        return [...updated].sort((a, b) => {
          if (a.is_accepted !== b.is_accepted) return a.is_accepted ? -1 : 1;
          return b.vote_count - a.vote_count;
        });
      });

      const response = await forumHttpService.voteAnswer(answerId, token);
      if (response.success) {
        // Sincroniza con el orden real del servidor
        await reload(true);
      } else {
        // Revert on failure
        setAnswers((prev) =>
          prev.map((a) =>
            a.id === answerId
              ? { ...a, has_voted: !a.has_voted, vote_count: a.has_voted ? a.vote_count - 1 : a.vote_count + 1 }
              : a,
          ),
        );
      }
      setVotingId(null);
    },
    [token, votingId, reload],
  );

  const accept = useCallback(
    async (answerId: string, currentlyAccepted: boolean): Promise<string | null> => {
      if (!token || acceptingId) return null;
      setAcceptingId(answerId);
      const response = await forumHttpService.acceptAnswer(
        answerId,
        { is_accepted: !currentlyAccepted },
        token,
      );
      if (response.success) {
        await reload();
        setAcceptingId(null);
        return null;
      }
      setAcceptingId(null);
      return response.error ?? 'Error al procesar la aceptación.';
    },
    [token, acceptingId, reload],
  );

  return { answers, status, error, votingId, acceptingId, reload, vote, accept };
};
