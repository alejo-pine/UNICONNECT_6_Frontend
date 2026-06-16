import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, ChevronRight, Loader2, Bell, BellOff, CheckCircle2, Plus, X, Search, ChevronLeft, Filter } from 'lucide-react';
import { useAuthStore } from '@shared/store/authStore';
import { useEventsFeed } from '../hooks/useEventsFeed';
import { useEventSubscription } from '../hooks/useEventSubscription';
import { useCategories } from '../hooks/useCategories';
import { eventsHttpService } from '../../infrastructure/eventsHttpService';
import type { EventCardSummary } from '../../domain/events';

function HighlightText({ text, search }: { text: string; search: string }) {
  if (!search || search.length < 3) return <>{text}</>;
  const parts = text.split(new RegExp(`(${search})`, 'gi'));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === search.toLowerCase() ? (
          <mark key={i} className="rounded-sm bg-yellow-200 px-0.5 text-ink-900">{part}</mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

const formatDate = (dateValue: string): string => {
  const date = new Date(`${dateValue}T00:00:00`);
  if (Number.isNaN(date.getTime())) return dateValue;
  return new Intl.DateTimeFormat('es-CO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
};

const formatTime = (timeValue: string): string => {
  const [hours, minutes] = timeValue.split(':').map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return timeValue;
  const d = new Date();
  d.setHours(hours, minutes, 0, 0);
  return new Intl.DateTimeFormat('es-CO', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(d);
};

function EventCard({ event, search, onPress }: { event: EventCardSummary; search: string; onPress: () => void }) {
  const isSoldOut = event.available_spots <= 0;

  return (
    <div className="overflow-hidden rounded-xl border border-ink-100 bg-white shadow-sm transition hover:shadow-md flex flex-col h-full">
      <div className="relative">
        {event.image_url?.trim() ? (
          <img
            src={event.image_url}
            alt={event.title}
            className={`h-36 w-full object-cover ${isSoldOut ? 'opacity-70 grayscale' : ''}`}
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : (
          <div className="flex h-36 w-full items-center justify-center bg-brand-50">
            <span
              className="material-symbols-outlined text-5xl"
              style={{ color: '#00284D', opacity: 0.15 }}
            >
              event
            </span>
          </div>
        )}
        
        {isSoldOut && (
          <div className="absolute right-3 top-3 rounded-md bg-red-600 px-2 py-1 text-xs font-bold uppercase tracking-wide text-white shadow-sm">
            Cupo Agotado
          </div>
        )}
      </div>

      <div className="flex flex-col p-4 flex-1">
        <h2 className="text-base font-bold text-[#00284D]">
          <HighlightText text={event.title} search={search} />
        </h2>
        <p className="mt-0.5 text-xs font-bold uppercase tracking-wide text-[#C5A059]">
          {event.faculty || 'Facultad no disponible'}
        </p>

        <p className="mt-2 line-clamp-3 text-sm text-slate-600 flex-1">
          <HighlightText text={event.description || 'Sin descripción disponible.'} search={search} />
        </p>

        <div className="mt-3 flex items-center gap-2 text-sm text-slate-700">
          <Calendar size={14} className="flex-shrink-0 text-[#C5A059]" />
          <span>{formatDate(event.event_date)}</span>
        </div>
        <div className="mt-1 flex items-center gap-2 text-sm text-slate-700">
          <Clock size={14} className="flex-shrink-0 text-[#C5A059]" />
          <span>{formatTime(event.event_time)}</span>
        </div>

        <div className="mt-4 flex justify-end pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onPress}
            className="flex items-center gap-1 text-xs font-bold uppercase tracking-wide text-[#00284D] hover:underline"
          >
            Ver más <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

function CategorySubscriptionPanel({ availableCategories, loadingCategories }: { availableCategories: string[], loadingCategories: boolean }) {
  const { isSubscribed, toggleSubscription, loadingCategory, loadingInit, error } = useEventSubscription();

  return (
    <div className="rounded-xl border border-ink-100 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#00284D]">
          <Bell size={16} className="text-[#C5A059]" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-[#00284D]">Notificaciones por Categoría</h2>
          <p className="text-xs text-slate-500">
            Recibe alertas cuando se publiquen nuevos eventos
          </p>
        </div>
      </div>

      {error && (
        <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>
      )}

      {loadingInit || loadingCategories ? (
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="h-7 w-24 animate-pulse rounded-full bg-slate-100"
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {availableCategories.map((category) => {
            const subscribed = isSubscribed(category);
            const loading = loadingCategory === category;

            return (
              <button
                key={category}
                type="button"
                id={`subscribe-category-${category.toLowerCase().replace(/\s/g, '-')}`}
                onClick={() => void toggleSubscription(category)}
                disabled={loading || loadingCategory !== null}
                className={[
                  'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all',
                  subscribed
                    ? 'bg-[#00284D] text-white shadow-sm hover:bg-[#003a6b]'
                    : 'border border-slate-200 bg-white text-slate-600 hover:border-[#00284D] hover:text-[#00284D]',
                  loading ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer',
                ].join(' ')}
              >
                {loading ? (
                  <Loader2 size={11} className="animate-spin" />
                ) : subscribed ? (
                  <CheckCircle2 size={11} />
                ) : (
                  <BellOff size={11} />
                )}
                {category}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}


const FACULTIES = [
  "Facultad de Artes y Humanidades",
  "Facultad de Ciencias Agropecuarias",
  "Facultad de Ciencias Exactas y Naturales",
  "Facultad de Ciencias Jurídicas y Sociales",
  "Facultad de Ciencias para la Salud",
  "Facultad de Inteligencia artificial e Ingenierías"
];

export function EventsListPage() {
  const navigate = useNavigate();
  const limit = 10;
  const { 
    events, total, loading, error, reload, 
    search, setSearch, 
    page, setPage, 
    categories, handleCategoryToggle 
  } = useEventsFeed(limit);
  const token = useAuthStore((s) => s.token);

  const { categories: dynamicCategories, loadingCategories } = useCategories();
  const availableCategories = dynamicCategories.map(c => c.name);

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    title: '',
    category: '',
    description: '',
    imageUrl: '',
    eventDate: new Date().toISOString().split('T')[0],
    eventTime: '12:00',
    location: '',
    faculty: FACULTIES[0],
    capacity: ''
  });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !form.title.trim()) return;

    // Date/Time validation: at least 1 hour in the future
    const eventDateTime = new Date(`${form.eventDate}T${form.eventTime}`);
    const now = new Date();
    const diffInHours = (eventDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      setCreateError('La fecha y hora del evento deben ser al menos 1 hora después de la hora actual.');
      return;
    }

    setCreating(true);
    setCreateError(null);
    setCreateSuccess(null);
    const result = await eventsHttpService.createEvent(
      {
        title: form.title.trim(),
        category: form.category,
        description: form.description.trim() || undefined,
        imageUrl: form.imageUrl.trim() || undefined,
        eventDate: form.eventDate,
        eventTime: form.eventTime,
        location: form.location.trim() || undefined,
        faculty: form.faculty.trim() || undefined,
        capacity: form.capacity ? parseInt(form.capacity, 10) : undefined
      },
      token
    );
    setCreating(false);
    if (result.success) {
      setCreateSuccess(`Evento "${form.title}" creado. Las notificaciones han sido enviadas a los suscritos de "${form.category}".`);
      setForm({
        title: '',
        category: availableCategories[0] || '',
        description: '',
        imageUrl: '',
        eventDate: new Date().toISOString().split('T')[0],
        eventTime: '12:00',
        location: '',
        faculty: FACULTIES[0],
        capacity: ''
      });
      void reload();
    } else {
      setCreateError(result.error ?? 'Error al crear el evento.');
    }
  };

  if (!events && loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24">
        <Loader2 size={32} className="animate-spin text-[#00284D]" />
        <p className="text-sm text-slate-500">Cargando eventos...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-4 py-24">
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
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#00284D]">Eventos</h1>
          <p className="mt-1 text-sm text-slate-500">
            Mantente al día con los eventos de UniConnect
          </p>
        </div>
        <button
          id="btn-crear-evento"
          type="button"
          onClick={() => { 
            setModalOpen(true); 
            setCreateError(null); 
            setCreateSuccess(null); 
            if (!form.category && availableCategories.length > 0) {
              setForm(f => ({ ...f, category: availableCategories[0] }));
            }
          }}
          className="flex items-center gap-2 self-start rounded-xl bg-[#C5A059] px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-[#b08840] sm:self-auto"
        >
          <Plus size={16} />
          Crear Evento
        </button>
      </div>

      {/* Subscription panel */}
      <CategorySubscriptionPanel availableCategories={availableCategories} loadingCategories={loadingCategories} />

      <div className="flex flex-col gap-4 rounded-xl border border-ink-100 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Filter size={18} className="text-[#C5A059]" />
          <h2 className="text-sm font-bold text-[#00284D]">Filtros y Búsqueda</h2>
        </div>

        <div className="flex flex-col gap-4 md:flex-row">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por título o descripción... (mín. 3 caracteres)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-4 text-sm text-[#00284D] outline-none transition focus:border-[#00284D] focus:ring-2 focus:ring-[#00284D]/10"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2 pt-2">
          {availableCategories.map((cat) => {
            const isSelected = categories.includes(cat);
            return (
              <button
                key={cat}
                onClick={() => handleCategoryToggle(cat)}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-all ${
                  isSelected 
                    ? 'border-[#00284D] bg-[#00284D] text-white' 
                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-[#00284D]'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center gap-3 py-16">
          <Loader2 size={32} className="animate-spin text-[#00284D]" />
          <p className="text-sm text-slate-500">Buscando eventos...</p>
        </div>
      ) : events.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16">
          <span className="material-symbols-outlined text-5xl text-[#C5A059]">event_busy</span>
          <p className="text-lg font-bold text-[#00284D]">No se encontraron eventos</p>
          <p className="text-sm text-slate-500">Intenta con otros filtros de búsqueda.</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between text-sm text-slate-500">
            <p>Mostrando <strong className="text-[#00284D]">{events.length}</strong> de <strong className="text-[#00284D]">{total}</strong> resultados</p>
          </div>
          
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                search={search}
                onPress={() => navigate(`/events/${event.id}`)}
              />
            ))}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-center gap-4 pt-6">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              className="flex items-center gap-1 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={16} /> Anterior
            </button>
            <span className="text-sm font-bold text-[#00284D]">
              Página {page} de {Math.ceil(total / limit) || 1}
            </span>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page >= Math.ceil(total / limit)}
              className="flex items-center gap-1 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Siguiente <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Create Event Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setModalOpen(false); }}
        >
          <div className="flex max-h-[90vh] w-full max-w-md flex-col rounded-2xl bg-white shadow-xl">
            {/* Modal header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h2 className="text-lg font-bold text-[#00284D]">Crear Evento</h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal body */}
            <div className="overflow-y-auto p-6">
              <form onSubmit={(e) => void handleCreate(e)} className="space-y-4">
              {createSuccess && (
                <div className="flex items-start gap-2 rounded-xl bg-green-50 p-3 text-sm text-green-700">
                  <CheckCircle2 size={16} className="mt-0.5 flex-shrink-0" />
                  <p>{createSuccess}</p>
                </div>
              )}
              {createError && (
                <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{createError}</p>
              )}

              <div className="space-y-1">
                <label htmlFor="event-title" className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Título *
                </label>
                <input
                  id="event-title"
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="Ej: Feria de Ciencias 2025"
                  required
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-[#00284D] outline-none transition focus:border-[#00284D] focus:ring-2 focus:ring-[#00284D]/10"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="event-category" className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Categoría *
                </label>
                <select
                  id="event-category"
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-[#00284D] outline-none transition focus:border-[#00284D] focus:ring-2 focus:ring-[#00284D]/10"
                >
                  {availableCategories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label htmlFor="event-description" className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Descripción
                </label>
                <textarea
                  id="event-description"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Detalles del evento..."
                  rows={3}
                  className="w-full resize-none rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-[#00284D] outline-none transition focus:border-[#00284D] focus:ring-2 focus:ring-[#00284D]/10"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label htmlFor="event-date" className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Fecha *
                  </label>
                  <input
                    id="event-date"
                    type="date"
                    value={form.eventDate}
                    onChange={(e) => setForm((f) => ({ ...f, eventDate: e.target.value }))}
                    required
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-[#00284D] outline-none transition focus:border-[#00284D] focus:ring-2 focus:ring-[#00284D]/10"
                  />
                </div>
                <div className="space-y-1">
                  <label htmlFor="event-time" className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Hora *
                  </label>
                  <input
                    id="event-time"
                    type="time"
                    value={form.eventTime}
                    onChange={(e) => setForm((f) => ({ ...f, eventTime: e.target.value }))}
                    required
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-[#00284D] outline-none transition focus:border-[#00284D] focus:ring-2 focus:ring-[#00284D]/10"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label htmlFor="event-location" className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Ubicación
                </label>
                <input
                  id="event-location"
                  type="text"
                  value={form.location}
                  onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                  placeholder="Ej: Auditorio Principal"
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-[#00284D] outline-none transition focus:border-[#00284D] focus:ring-2 focus:ring-[#00284D]/10"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="event-faculty" className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Facultad
                </label>
                <select
                  id="event-faculty"
                  value={form.faculty}
                  onChange={(e) => setForm((f) => ({ ...f, faculty: e.target.value }))}
                  className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-[#00284D] outline-none transition focus:border-[#00284D] focus:ring-2 focus:ring-[#00284D]/10"
                >
                  {FACULTIES.map((faculty) => (
                    <option key={faculty} value={faculty}>
                      {faculty}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label htmlFor="event-capacity" className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Cupos disponibles (opcional)
                </label>
                <input
                  id="event-capacity"
                  type="number"
                  min="1"
                  value={form.capacity}
                  onChange={(e) => setForm((f) => ({ ...f, capacity: e.target.value }))}
                  placeholder="Ej: 50"
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-[#00284D] outline-none transition focus:border-[#00284D] focus:ring-2 focus:ring-[#00284D]/10"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="event-image" className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  URL de Imagen
                </label>
                <input
                  id="event-image"
                  type="url"
                  value={form.imageUrl}
                  onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
                  placeholder="https://ejemplo.com/imagen.jpg"
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-[#00284D] outline-none transition focus:border-[#00284D] focus:ring-2 focus:ring-[#00284D]/10"
                />
              </div>

              <p className="text-xs text-slate-400">
                Al crear el evento, todos los estudiantes suscritos a "<strong>{form.category}</strong>" recibirán una notificación automáticamente.
              </p>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  id="btn-submit-evento"
                  type="submit"
                  disabled={creating || !form.title.trim() || !form.eventDate || !form.eventTime}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#00284D] py-2.5 text-sm font-bold text-white transition hover:bg-[#003a6b] disabled:opacity-60"
                >
                  {creating ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
                  {creating ? 'Creando...' : 'Crear Evento'}
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
