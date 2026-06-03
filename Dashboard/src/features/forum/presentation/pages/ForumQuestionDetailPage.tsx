import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  Loader2,
  ChevronLeft,
  CheckCircle2,
  Circle,
  ThumbsUp,
  AlertCircle,
  Lock,
  Send,
  Award,
  X,
} from 'lucide-react';
import { useAuthStore } from '@shared/store/authStore';
import { useForumAnswers } from '../hooks/useForumAnswers';
import { forumHttpService } from '../../infrastructure/forumHttpService';
import type { ForumQuestion } from '../../domain/forum';

const formatDate = (iso: string): string => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat('es-CO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

const CONTENT_MIN = 1;

export function ForumQuestionDetailPage() {
  const { subjectId, questionId } = useParams<{
    subjectId: string;
    questionId: string;
  }>();
  const navigate = useNavigate();
  const location = useLocation();
  const question = (location.state as { question?: ForumQuestion } | null)?.question;
  const token = useAuthStore((s) => s.token);
  const userId = useAuthStore((s) => s.userId);

  const { answers, status, error, votingId, acceptingId, reload, vote, accept } =
    useForumAnswers(questionId ?? '');

  const [answerContent, setAnswerContent] = useState('');
  const [answerError, setAnswerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [acceptError, setAcceptError] = useState<string | null>(null);
  const acceptErrorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showAcceptError = (msg: string) => {
    if (acceptErrorTimerRef.current) clearTimeout(acceptErrorTimerRef.current);
    setAcceptError(msg);
    acceptErrorTimerRef.current = setTimeout(() => setAcceptError(null), 5000);
  };

  useEffect(() => {
    return () => {
      if (acceptErrorTimerRef.current) clearTimeout(acceptErrorTimerRef.current);
    };
  }, []);

  const handleSubmitAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !questionId) return;
    if (!answerContent.trim()) {
      setAnswerError('La respuesta no puede estar vacía.');
      return;
    }
    setSubmitting(true);
    setAnswerError(null);
    const result = await forumHttpService.createAnswer(
      questionId,
      { content: answerContent.trim() },
      token,
    );
    setSubmitting(false);
    if (result.success) {
      setAnswerContent('');
      await reload();
    } else {
      setAnswerError(result.error ?? 'Error al publicar la respuesta.');
    }
  };

  const handleAccept = async (answerId: string, currentlyAccepted: boolean) => {
    setAcceptError(null);
    const err = await accept(answerId, currentlyAccepted);
    if (err) showAcceptError(err);
  };

  const isResolved = answers.some((a) => a.is_accepted);

  if (status === 'loading' || status === 'idle') {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24">
        <Loader2 size={32} className="animate-spin text-[#00284D]" />
        <p className="text-sm text-slate-500">Cargando respuestas...</p>
      </div>
    );
  }

  if (status === 'forbidden') {
    return (
      <div className="flex flex-col items-center gap-4 py-24">
        <Lock size={40} className="text-slate-400" />
        <p className="text-lg font-bold text-[#00284D]">Acceso restringido</p>
        <p className="text-sm text-slate-500 text-center max-w-sm">
          Debes estar matriculado o asignado como docente en esta asignatura para acceder al foro.
        </p>
        <button
          type="button"
          onClick={() => navigate('/forum')}
          className="rounded-lg bg-[#00284D] px-5 py-2 text-sm font-medium text-white transition hover:bg-[#003a6b]"
        >
          Volver a mis materias
        </button>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="flex flex-col items-center gap-4 py-24">
        <AlertCircle size={40} className="text-red-400" />
        <p className="text-sm text-red-500">{error}</p>
        <button
          type="button"
          onClick={() => void reload()}
          className="rounded-lg bg-[#00284D] px-5 py-2 text-sm font-medium text-white transition hover:bg-[#003a6b]"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="relative space-y-6 max-w-3xl">
      {/* Toast de error para aceptación — siempre visible independiente del scroll */}
      {acceptError && (
        <div className="fixed bottom-6 right-6 z-50 flex items-start gap-3 rounded-xl border border-red-200 bg-white px-4 py-3 shadow-xl max-w-sm animate-in fade-in slide-in-from-bottom-2">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-red-100">
            <AlertCircle size={16} className="text-red-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-red-700">Sin permiso</p>
            <p className="mt-0.5 text-xs text-red-600 leading-snug">{acceptError}</p>
          </div>
          <button
            type="button"
            onClick={() => setAcceptError(null)}
            className="flex-shrink-0 text-slate-400 hover:text-slate-600 transition"
          >
            <X size={14} />
          </button>
        </div>
      )}
      {/* Back navigation */}
      <button
        type="button"
        onClick={() => navigate(`/forum/${subjectId}`)}
        className="flex items-center gap-1 text-sm text-slate-400 hover:text-[#00284D] transition"
      >
        <ChevronLeft size={16} />
        Volver al foro
      </button>

      {/* Question card */}
      {question && (
        <div className="rounded-xl border border-[#00284D]/10 bg-white p-6 shadow-sm">
          <div className="flex items-start gap-3 mb-4">
            <div className="mt-0.5 flex-shrink-0">
              {isResolved ? (
                <CheckCircle2 size={20} className="text-green-500" />
              ) : (
                <Circle size={20} className="text-slate-300" />
              )}
            </div>
            <h1 className="text-xl font-bold text-[#00284D] leading-snug">{question.title}</h1>
          </div>

          <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap mb-5">
            {question.content}
          </p>

          <div className="flex items-center gap-2 text-xs text-slate-400">
            {question.author_avatar ? (
              <img
                src={question.author_avatar}
                alt={question.author_name}
                className="h-6 w-6 rounded-full object-cover"
              />
            ) : (
              <span
                className="material-symbols-outlined"
                style={{ fontSize: '20px', color: '#94a3b8' }}
              >
                account_circle
              </span>
            )}
            <span className="font-medium text-slate-500">{question.author_name}</span>
            <span>·</span>
            <span>{formatDate(question.created_at)}</span>
            <span>·</span>
            <span
              className={`font-semibold ${isResolved ? 'text-green-600' : 'text-slate-400'}`}
            >
              {isResolved ? 'Resuelta' : 'Abierta'}
            </span>
          </div>
        </div>
      )}

      {/* Answers section */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-[#00284D]">
          {answers.length === 0
            ? 'Sin respuestas aún'
            : `${answers.length} ${answers.length === 1 ? 'respuesta' : 'respuestas'}`}
        </h2>

        {answers.map((answer) => (
          <div
            key={answer.id}
            className={[
              'rounded-xl border p-5 transition',
              answer.is_accepted
                ? 'border-green-300 bg-green-50'
                : 'border-slate-100 bg-white',
            ].join(' ')}
          >
            {answer.is_accepted && (
              <div className="mb-3 flex items-center gap-2 text-green-700">
                <Award size={16} />
                <span className="text-xs font-bold uppercase tracking-wide">
                  Respuesta aceptada
                </span>
              </div>
            )}

            {/* Author */}
            <div className="flex items-center gap-2 mb-3">
              {answer.author_avatar ? (
                <img
                  src={answer.author_avatar}
                  alt={answer.author_name}
                  className="h-8 w-8 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200">
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: '18px', color: '#94a3b8' }}
                  >
                    account_circle
                  </span>
                </div>
              )}
              <div>
                <p className="text-sm font-semibold text-[#00284D]">{answer.author_name}</p>
                <p className="text-xs text-slate-400">{formatDate(answer.created_at)}</p>
              </div>
            </div>

            {/* Content */}
            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
              {answer.content}
            </p>

            {/* Actions */}
            <div className="mt-4 flex items-center gap-4">
              {/* Vote button */}
              <button
                type="button"
                onClick={() => void vote(answer.id)}
                disabled={votingId === answer.id}
                className={[
                  'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition',
                  answer.has_voted
                    ? 'bg-[#00284D] text-white'
                    : 'border border-slate-200 text-slate-600 hover:border-[#00284D] hover:text-[#00284D]',
                  votingId === answer.id ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer',
                ].join(' ')}
              >
                {votingId === answer.id ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <ThumbsUp size={12} />
                )}
                {answer.vote_count} {answer.vote_count === 1 ? 'voto' : 'votos'}
              </button>

              {/* Accept button — shown to all but only docentes succeed (backend valida) */}
              {!answer.is_accepted && (
                <button
                  type="button"
                  onClick={() => void handleAccept(answer.id, answer.is_accepted)}
                  disabled={acceptingId === answer.id}
                  className={[
                    'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition',
                    'border border-slate-200 text-slate-500 hover:border-green-400 hover:text-green-600',
                    acceptingId === answer.id ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer',
                  ].join(' ')}
                >
                  {acceptingId === answer.id ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <CheckCircle2 size={12} />
                  )}
                  Aceptar respuesta
                </button>
              )}

              {answer.is_accepted && userId && (
                <button
                  type="button"
                  onClick={() => void handleAccept(answer.id, answer.is_accepted)}
                  disabled={acceptingId === answer.id}
                  className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold border border-green-300 text-green-700 hover:border-red-300 hover:text-red-500 transition disabled:opacity-60"
                >
                  {acceptingId === answer.id ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <CheckCircle2 size={12} />
                  )}
                  Desmarcar como aceptada
                </button>
              )}
            </div>
          </div>
        ))}

        {status === 'empty' && (
          <div className="flex flex-col items-center gap-2 py-10">
            <span
              className="material-symbols-outlined text-4xl"
              style={{ color: '#C5A059' }}
            >
              chat_bubble_outline
            </span>
            <p className="text-sm text-slate-500">
              Todavía no hay respuestas. ¡Sé el primero en responder!
            </p>
          </div>
        )}
      </div>

      {/* Answer form */}
      <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
        <h3 className="mb-3 text-base font-bold text-[#00284D]">Tu respuesta</h3>
        <form onSubmit={(e) => void handleSubmitAnswer(e)} className="space-y-3">
          {answerError && (
            <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">
              {answerError}
            </p>
          )}
          <textarea
            value={answerContent}
            onChange={(e) => setAnswerContent(e.target.value)}
            placeholder="Escribe tu respuesta aquí..."
            rows={5}
            className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm text-[#00284D] outline-none transition focus:border-[#00284D] focus:ring-2 focus:ring-[#00284D]/10"
          />
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting || !answerContent.trim()}
              className="flex items-center gap-2 rounded-xl bg-[#00284D] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#003a6b] disabled:opacity-60"
            >
              {submitting ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <Send size={15} />
              )}
              {submitting ? 'Publicando...' : 'Publicar respuesta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
