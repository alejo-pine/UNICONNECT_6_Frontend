import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, MapPin, User, Tag, School, Loader2, BellOff, CheckCircle2 } from 'lucide-react';
import { useEventDetail } from '../hooks/useEventDetail';
import { useEventSubscription } from '../hooks/useEventSubscription';

const formatDate = (dateValue: string): string => {
  const date = new Date(`${dateValue}T00:00:00`);
  if (Number.isNaN(date.getTime())) return dateValue || 'No disponible';
  return new Intl.DateTimeFormat('es-CO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
};

const formatTime = (timeValue: string): string => {
  const [hours, minutes] = timeValue.split(':').map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return timeValue || 'No disponible';
  const d = new Date();
  d.setHours(hours, minutes, 0, 0);
  return new Intl.DateTimeFormat('es-CO', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(d);
};

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-ink-100 bg-white p-3">
      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-[#00284D]">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] uppercase tracking-wide text-slate-400">{label}</p>
        <p className="truncate text-sm font-semibold text-[#00284D]">{value || 'No disponible'}</p>
      </div>
    </div>
  );
}

export function EventDetailPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { event, loading, error, retry } = useEventDetail(eventId);
  const { isSubscribed, toggleSubscription, loadingCategory } = useEventSubscription();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24">
        <Loader2 size={32} className="animate-spin text-[#00284D]" />
        <p className="text-sm text-slate-500">Cargando detalle del evento...</p>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="flex flex-col items-center gap-4 py-24">
        <p className="text-sm text-red-500">{error ?? 'No se encontró el evento.'}</p>
        <button
          type="button"
          onClick={() => void retry()}
          className="rounded-lg bg-[#00284D] px-5 py-2 text-sm font-medium text-white transition hover:bg-[#003a6b]"
        >
          Reintentar
        </button>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="text-sm text-slate-500 underline"
        >
          Volver
        </button>
      </div>
    );
  }

  const category = event.category?.trim();
  const categorySubscribed = category ? isSubscribed(category) : false;
  const categoryLoading = category ? loadingCategory === category : false;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex flex-shrink-0 items-center gap-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="rounded-lg p-1 text-ink-500 hover:bg-ink-100"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-bold text-ink-900">Detalle del Evento</h1>
      </div>

      {/* Hero image */}
      {event.image_url?.trim() ? (
        <img
          src={event.image_url}
          alt={event.title}
          className="h-56 w-full rounded-xl object-cover"
        />
      ) : (
        <div className="flex h-56 w-full items-center justify-center rounded-xl bg-brand-50">
          <span
            className="material-symbols-outlined text-7xl"
            style={{ color: '#00284D', opacity: 0.12 }}
          >
            event
          </span>
        </div>
      )}

      {/* Title + subscribe button */}
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-2xl font-bold leading-tight text-[#00284D]">{event.title}</h2>
        {category && (
          <button
            id={`subscribe-category-detail-${category.toLowerCase().replace(/\s/g, '-')}`}
            type="button"
            onClick={() => void toggleSubscription(category)}
            disabled={categoryLoading}
            title={categorySubscribed ? `Desuscribirse de "${category}"` : `Suscribirse a "${category}"`}
            className={[
              'flex flex-shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all',
              categorySubscribed
                ? 'bg-[#00284D] text-white hover:bg-[#003a6b]'
                : 'border border-slate-200 bg-white text-slate-600 hover:border-[#00284D] hover:text-[#00284D]',
              categoryLoading ? 'opacity-60 cursor-not-allowed' : '',
            ].join(' ')}
          >
            {categoryLoading ? (
              <Loader2 size={12} className="animate-spin" />
            ) : categorySubscribed ? (
              <CheckCircle2 size={12} />
            ) : (
              <BellOff size={12} />
            )}
            {categorySubscribed ? `Suscrito a "${category}"` : `Suscribirse a "${category}"`}
          </button>
        )}
      </div>

      {/* Info grid */}
      <div className="grid gap-3 sm:grid-cols-2">
        <InfoRow
          icon={<School size={18} className="text-[#C5A059]" />}
          label="Facultad"
          value={event.faculty}
        />
        <InfoRow
          icon={<Tag size={18} className="text-[#C5A059]" />}
          label="Categoría"
          value={event.category}
        />
        <InfoRow
          icon={<User size={18} className="text-[#C5A059]" />}
          label="Informado por"
          value={event.organizer_name}
        />
        <InfoRow
          icon={<MapPin size={18} className="text-[#C5A059]" />}
          label="Ubicación"
          value={event.location}
        />
        <InfoRow
          icon={<Calendar size={18} className="text-[#C5A059]" />}
          label="Fecha"
          value={formatDate(event.event_date)}
        />
        <InfoRow
          icon={<Clock size={18} className="text-[#C5A059]" />}
          label="Hora"
          value={formatTime(event.event_time)}
        />
      </div>

      {/* Description */}
      <div>
        <h3 className="mb-2 text-xl font-bold text-[#C5A059]">Descripción</h3>
        <p className="text-[15px] leading-relaxed text-slate-600">
          {event.description || 'Sin descripción disponible.'}
        </p>
      </div>
    </div>
  );
}
