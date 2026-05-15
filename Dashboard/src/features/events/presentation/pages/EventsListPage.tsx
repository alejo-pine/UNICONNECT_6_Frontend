import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, ChevronRight, Loader2 } from 'lucide-react';
import { useEventsFeed } from '../hooks/useEventsFeed';
import type { EventCardSummary } from '../../domain/events';

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

function EventCard({ event, onPress }: { event: EventCardSummary; onPress: () => void }) {
  return (
    <div className="overflow-hidden rounded-xl border border-ink-100 bg-white shadow-sm">
      {event.image_url?.trim() ? (
        <img
          src={event.image_url}
          alt={event.title}
          className="h-36 w-full object-cover"
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

      <div className="p-4">
        <h2 className="text-base font-bold text-[#00284D]">{event.title}</h2>
        <p className="mt-0.5 text-xs font-bold uppercase tracking-wide text-[#C5A059]">
          {event.faculty || 'Facultad no disponible'}
        </p>

        <p className="mt-2 line-clamp-3 text-sm text-slate-600">
          {event.description || 'Sin descripción disponible.'}
        </p>

        <div className="mt-3 flex items-center gap-2 text-sm text-slate-700">
          <Calendar size={14} className="flex-shrink-0 text-[#C5A059]" />
          <span>{formatDate(event.event_date)}</span>
        </div>
        <div className="mt-1 flex items-center gap-2 text-sm text-slate-700">
          <Clock size={14} className="flex-shrink-0 text-[#C5A059]" />
          <span>{formatTime(event.event_time)}</span>
        </div>

        <div className="mt-3 flex justify-end">
          <button
            type="button"
            onClick={onPress}
            className="flex items-center gap-1 text-xs font-bold uppercase tracking-wide text-[#C5A059] hover:underline"
          >
            Ver más <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

export function EventsListPage() {
  const navigate = useNavigate();
  const { events, loading, error, hasEvents, reload } = useEventsFeed(20);

  if (loading) {
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

  if (!hasEvents) {
    return (
      <div className="flex flex-col items-center gap-3 py-24">
        <span className="material-symbols-outlined text-5xl text-[#C5A059]">event_busy</span>
        <p className="text-lg font-bold text-[#00284D]">No hay eventos por ahora</p>
        <p className="text-sm text-slate-500">Cuando se publiquen eventos aparecerán aquí.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#00284D]">Eventos</h1>
        <p className="mt-1 text-sm text-slate-500">
          Mantente al día con los eventos de UniConnect
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {events.map((event) => (
          <EventCard
            key={event.id}
            event={event}
            onPress={() => navigate(`/events/${event.id}`)}
          />
        ))}
      </div>
    </div>
  );
}
