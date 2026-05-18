import { memo, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Search, Users, BookOpen, AlertCircle, UserSearch } from 'lucide-react';
import { useSubjectSearch } from '../hooks/useSubjectSearch';
import { useClassmates } from '../hooks/useClassmates';
import type { Classmate } from '../../domain/search';

const getInitials = (name: string): string => {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

const ClassmateCard = memo(function ClassmateCard({
  classmate,
  onPress,
}: {
  classmate: Classmate;
  onPress: () => void;
}) {
  const [imgError, setImgError] = useState(false);
  const initials = getInitials(classmate.name);

  return (
    <button
      type="button"
      onClick={onPress}
      className="group flex flex-col items-center gap-3 rounded-xl border border-ink-100 bg-white p-5 shadow-sm transition hover:shadow-md hover:border-[#C5A059] text-left w-full"
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        {classmate.avatar_url && !imgError ? (
          <img
            src={classmate.avatar_url}
            alt={classmate.name}
            className="h-16 w-16 rounded-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <div
            className="h-16 w-16 rounded-full flex items-center justify-center text-xl font-bold text-white"
            style={{ background: '#00284D' }}
          >
            {initials}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="text-center min-w-0 w-full">
        <p className="font-semibold text-[#00284D] text-sm leading-snug line-clamp-2">
          {classmate.name}
        </p>
        <p className="mt-0.5 text-xs text-slate-500 line-clamp-1">{classmate.career}</p>
        {classmate.semester != null && (
          <span
            className="mt-1.5 inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide"
            style={{ background: 'rgba(197,160,89,0.12)', color: '#C5A059' }}
          >
            Semestre {classmate.semester}
          </span>
        )}
      </div>

      <span
        className="mt-auto text-xs font-bold uppercase tracking-wide transition-colors group-hover:underline"
        style={{ color: '#C5A059' }}
      >
        Ver perfil
      </span>
    </button>
  );
});

export function SearchPage() {
  const navigate = useNavigate();
  const { subjects, selectedSubject, loadingSubjects, subjectsError, selectSubject } =
    useSubjectSearch();
  const { classmates, status, error, searchClassmates, reset } = useClassmates();
  const [showWarning, setShowWarning] = useState(false);

  const handleSelectChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const id = e.target.value;
      if (!id) {
        reset();
        return;
      }
      const found = subjects.find((s) => s.id === id);
      if (found) {
        selectSubject(found);
        setShowWarning(false);
      }
    },
    [subjects, selectSubject, reset],
  );

  const handleSearch = useCallback(() => {
    if (!selectedSubject) {
      setShowWarning(true);
      return;
    }
    setShowWarning(false);
    void searchClassmates(selectedSubject.id);
  }, [selectedSubject, searchClassmates]);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold text-[#00284D]">Buscar compañeros</h1>
        <p className="mt-1 text-sm text-slate-500">
          Encuentra compañeros inscritos en tus materias y contáctalos por mensaje directo.
        </p>
      </div>

      {/* Search controls */}
      <div className="rounded-xl border border-ink-100 bg-white p-6 shadow-sm">
        <label className="block text-sm font-semibold text-[#00284D] mb-2">
          Selecciona una materia
        </label>

        {subjectsError ? (
          <div className="flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 border border-red-100 mb-3">
            <AlertCircle size={16} className="flex-shrink-0" />
            <span>{subjectsError}</span>
          </div>
        ) : null}

        <div className="flex gap-3">
          <div className="relative flex-1">
            {loadingSubjects && (
              <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                <Loader2 size={16} className="animate-spin text-slate-400" />
              </div>
            )}
            <select
              className="w-full rounded-lg border border-ink-200 bg-white py-2.5 pl-4 pr-10 text-sm text-[#00284D] focus:border-[#00284D] focus:outline-none focus:ring-2 focus:ring-[#00284D]/20 disabled:opacity-50 appearance-none"
              value={selectedSubject?.id ?? ''}
              onChange={handleSelectChange}
              disabled={loadingSubjects || !!subjectsError}
            >
              <option value="">
                {loadingSubjects ? 'Cargando materias...' : '-- Selecciona una materia --'}
              </option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                  {s.code ? ` (${s.code})` : ''}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
              {!loadingSubjects && (
                <span className="material-symbols-outlined text-slate-400" style={{ fontSize: '18px' }}>
                  expand_more
                </span>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={handleSearch}
            disabled={loadingSubjects || status === 'loading'}
            className="flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition disabled:opacity-50"
            style={{ background: '#00284D' }}
          >
            {status === 'loading' ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Search size={16} />
            )}
            Buscar
          </button>
        </div>

        {showWarning && (
          <p className="mt-2 flex items-center gap-1.5 text-xs text-amber-600">
            <AlertCircle size={13} />
            Selecciona una materia antes de buscar.
          </p>
        )}
      </div>

      {/* Results area */}
      {status === 'loading' && (
        <div className="flex flex-col items-center gap-3 py-16">
          <Loader2 size={32} className="animate-spin text-[#00284D]" />
          <p className="text-sm text-slate-500">Buscando compañeros...</p>
        </div>
      )}

      {status === 'success' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Users size={16} className="text-[#C5A059]" />
            <p className="text-sm font-semibold text-[#00284D]">
              {classmates.length} compañero{classmates.length !== 1 ? 's' : ''} encontrado
              {classmates.length !== 1 ? 's' : ''} en{' '}
              <span className="text-[#C5A059]">{selectedSubject?.name}</span>
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {classmates.map((classmate) => (
              <ClassmateCard
                key={classmate.id}
                classmate={classmate}
                onPress={() => navigate(`/search/profile/${classmate.id}`)}
              />
            ))}
          </div>
        </div>
      )}

      {status === 'empty' && (
        <div className="flex flex-col items-center gap-3 py-16">
          <div
            className="flex h-16 w-16 items-center justify-center rounded-full"
            style={{ background: 'rgba(0,40,77,0.06)' }}
          >
            <UserSearch size={28} style={{ color: '#00284D', opacity: 0.4 }} />
          </div>
          <p className="text-base font-bold text-[#00284D]">Sin compañeros encontrados</p>
          <p className="text-sm text-slate-500 text-center max-w-xs">
            No hay otros estudiantes inscritos en{' '}
            <span className="font-semibold">{selectedSubject?.name}</span> por el momento.
          </p>
        </div>
      )}

      {status === 'error' && (
        <div className="flex flex-col items-center gap-4 py-16">
          <AlertCircle size={32} className="text-red-400" />
          <p className="text-sm text-red-500">{error}</p>
          <button
            type="button"
            onClick={() => selectedSubject && void searchClassmates(selectedSubject.id)}
            className="rounded-lg px-5 py-2 text-sm font-medium text-white transition hover:opacity-90"
            style={{ background: '#00284D' }}
          >
            Reintentar
          </button>
        </div>
      )}

      {status === 'idle' && (
        <div className="flex flex-col items-center gap-3 py-16">
          <div
            className="flex h-16 w-16 items-center justify-center rounded-full"
            style={{ background: 'rgba(197,160,89,0.10)' }}
          >
            <BookOpen size={28} style={{ color: '#C5A059' }} />
          </div>
          <p className="text-base font-bold text-[#00284D]">Selecciona una materia</p>
          <p className="text-sm text-slate-500 text-center max-w-xs">
            Elige una de tus materias inscritas y haz clic en <strong>Buscar</strong> para
            encontrar compañeros de clase.
          </p>
        </div>
      )}
    </div>
  );
}
