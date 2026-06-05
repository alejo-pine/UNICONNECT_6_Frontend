import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Loader2,
  ChevronLeft,
  Plus,
  MessageCircle,
  CheckCircle2,
  Circle,
  AlertCircle,
  X,
  Lock,
} from 'lucide-react';
import { useAuthStore } from '@shared/store/authStore';
import { useForumQuestions } from '../hooks/useForumQuestions';
import { forumHttpService } from '../../infrastructure/forumHttpService';
import type { CreateQuestionPayload } from '../../domain/forum';

const formatDate = (iso: string): string => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat('es-CO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
};

const TITLE_MIN = 5;
const CONTENT_MIN = 10;

export function ForumQuestionsPage() {
  const { subjectId } = useParams<{ subjectId: string }>();
  const navigate = useNavigate();
  const token = useAuthStore((s) => s.token);
  const { questions, status, error, reload } = useForumQuestions(subjectId ?? '');

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ title: '', content: '' });
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const validate = (): string | null => {
    if (form.title.trim().length < TITLE_MIN)
      return `El título debe tener al menos ${TITLE_MIN} caracteres.`;
    if (form.content.trim().length < CONTENT_MIN)
      return `El contenido debe tener al menos ${CONTENT_MIN} caracteres.`;
    return null;
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validate();
    if (err) { setFormError(err); return; }
    if (!token || !subjectId) return;

    setSubmitting(true);
    setFormError(null);

    const payload: CreateQuestionPayload = {
      subject_id: subjectId,
      title: form.title.trim(),
      content: form.content.trim(),
    };

    const result = await forumHttpService.createQuestion(payload, token);
    setSubmitting(false);

    if (result.success) {
      setForm({ title: '', content: '' });
      setModalOpen(false);
      await reload();
    } else {
      setFormError(result.error ?? 'Error al crear la pregunta.');
    }
  };

  if (status === 'loading' || status === 'idle') {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24">
        <Loader2 size={32} className="animate-spin text-[#00284D]" />
        <p className="text-sm text-slate-500">Cargando preguntas...</p>
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/forum')}
            className="flex items-center justify-center rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-[#00284D] transition"
          >
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-[#00284D]">Foro de la asignatura</h1>
            <p className="mt-0.5 text-sm text-slate-500">
              {questions.length} {questions.length === 1 ? 'pregunta' : 'preguntas'}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => { setModalOpen(true); setFormError(null); }}
          className="flex items-center gap-2 rounded-xl bg-[#C5A059] px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-[#b08840]"
        >
          <Plus size={16} />
          Nueva pregunta
        </button>
      </div>

      {/* Empty state */}
      {status === 'empty' && (
        <div className="flex flex-col items-center gap-3 py-20">
          <span
            className="material-symbols-outlined text-5xl"
            style={{ color: '#C5A059' }}
          >
            help_outline
          </span>
          <p className="text-lg font-bold text-[#00284D]">Aún no hay preguntas</p>
          <p className="text-sm text-slate-500">¡Sé el primero en preguntar algo!</p>
        </div>
      )}

      {/* Questions list */}
      {status === 'success' && (
        <div className="space-y-3">
          {questions.map((q) => (
            <button
              key={q.id}
              type="button"
              onClick={() => navigate(`/forum/${subjectId}/question/${q.id}`, { state: { question: q } })}
              className="group w-full rounded-xl border border-slate-100 bg-white p-5 shadow-sm text-left transition hover:shadow-md hover:border-[#C5A059]"
            >
              <div className="flex items-start gap-3">
                {/* Status badge */}
                <div className="mt-0.5 flex-shrink-0">
                  {q.is_resolved ? (
                    <CheckCircle2 size={18} className="text-green-500" />
                  ) : (
                    <Circle size={18} className="text-slate-300" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-bold text-[#00284D] leading-snug line-clamp-2 group-hover:text-[#003a6b]">
                    {q.title}
                  </p>
                  <p className="mt-1 text-sm text-slate-500 line-clamp-2">
                    {q.content}
                  </p>

                  <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                    {/* Author avatar */}
                    {q.author_avatar ? (
                      <img
                        src={q.author_avatar}
                        alt={q.author_name}
                        className="h-5 w-5 rounded-full object-cover"
                      />
                    ) : (
                      <span
                        className="material-symbols-outlined text-base"
                        style={{ fontSize: '18px', color: '#94a3b8' }}
                      >
                        account_circle
                      </span>
                    )}
                    <span className="font-medium text-slate-500">{q.author_name}</span>
                    <span>·</span>
                    <span>{formatDate(q.created_at)}</span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <MessageCircle size={12} />
                      {q.answer_count} {q.answer_count === 1 ? 'respuesta' : 'respuestas'}
                    </span>
                    {q.is_resolved && (
                      <>
                        <span>·</span>
                        <span className="font-semibold text-green-600">Resuelta</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Create question modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setModalOpen(false); }}
        >
          <div className="flex max-h-[90vh] w-full max-w-md flex-col rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h2 className="text-lg font-bold text-[#00284D]">Nueva pregunta</h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <div className="overflow-y-auto p-6">
              <form onSubmit={(e) => void handleCreate(e)} className="space-y-4">
                {formError && (
                  <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">
                    {formError}
                  </p>
                )}

                <div className="space-y-1">
                  <label
                    htmlFor="q-title"
                    className="block text-xs font-semibold uppercase tracking-wide text-slate-500"
                  >
                    Título *
                  </label>
                  <input
                    id="q-title"
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    placeholder="Resume tu pregunta en pocas palabras"
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-[#00284D] outline-none transition focus:border-[#00284D] focus:ring-2 focus:ring-[#00284D]/10"
                  />
                  {form.title.trim().length > 0 && form.title.trim().length < TITLE_MIN && (
                    <p className="text-xs text-red-500">Mínimo {TITLE_MIN} caracteres</p>
                  )}
                </div>

                <div className="space-y-1">
                  <label
                    htmlFor="q-content"
                    className="block text-xs font-semibold uppercase tracking-wide text-slate-500"
                  >
                    Contenido *
                  </label>
                  <textarea
                    id="q-content"
                    value={form.content}
                    onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                    placeholder="Describe tu pregunta con detalle..."
                    rows={5}
                    className="w-full resize-none rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-[#00284D] outline-none transition focus:border-[#00284D] focus:ring-2 focus:ring-[#00284D]/10"
                  />
                  {form.content.trim().length > 0 && form.content.trim().length < CONTENT_MIN && (
                    <p className="text-xs text-red-500">Mínimo {CONTENT_MIN} caracteres</p>
                  )}
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#00284D] py-2.5 text-sm font-bold text-white transition hover:bg-[#003a6b] disabled:opacity-60"
                  >
                    {submitting ? (
                      <Loader2 size={15} className="animate-spin" />
                    ) : (
                      <Plus size={15} />
                    )}
                    {submitting ? 'Publicando...' : 'Publicar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
