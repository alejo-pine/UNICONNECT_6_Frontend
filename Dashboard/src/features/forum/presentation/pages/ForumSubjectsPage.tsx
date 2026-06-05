import { useNavigate } from 'react-router-dom';
import { Loader2, BookOpen, ChevronRight, AlertCircle } from 'lucide-react';
import { useUserSubjects } from '@features/groups/presentation/hooks/useUserSubjects';

export function ForumSubjectsPage() {
  const navigate = useNavigate();
  const { subjects, loading, error } = useUserSubjects();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24">
        <Loader2 size={32} className="animate-spin text-[#00284D]" />
        <p className="text-sm text-slate-500">Cargando materias...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-4 py-24">
        <AlertCircle size={40} className="text-red-400" />
        <p className="text-sm text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#00284D]">Foros académicos</h1>
        <p className="mt-1 text-sm text-slate-500">
          Selecciona una asignatura para ver sus preguntas y respuestas
        </p>
      </div>

      {subjects.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20">
          <span
            className="material-symbols-outlined text-5xl"
            style={{ color: '#C5A059' }}
          >
            forum
          </span>
          <p className="text-lg font-bold text-[#00284D]">
            No tienes materias inscritas
          </p>
          <p className="text-sm text-slate-500">
            Cuando estés inscrito en una asignatura, su foro aparecerá aquí.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {subjects.map((subject) => (
            <button
              key={subject.id}
              type="button"
              onClick={() => navigate(`/forum/${subject.id}`)}
              className="group flex items-center gap-4 rounded-xl border border-slate-100 bg-white p-5 shadow-sm transition hover:shadow-md hover:border-[#C5A059] text-left"
            >
              <div
                className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl"
                style={{ background: '#00284D' }}
              >
                <BookOpen size={22} color="#C5A059" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-[#00284D] leading-snug truncate">
                  {subject.name}
                </p>
                <p className="mt-0.5 text-xs text-slate-400">Ver preguntas del foro</p>
              </div>
              <ChevronRight
                size={18}
                className="flex-shrink-0 text-slate-300 group-hover:text-[#C5A059] transition"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
