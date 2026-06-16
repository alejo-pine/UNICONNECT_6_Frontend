import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Phone, Copy, MessageSquare, Loader2, AlertCircle, BookOpen } from 'lucide-react';
import { usePublicProfile } from '../hooks/usePublicProfile';
import { dmHttpService } from '@features/chat/infrastructure/dmHttpService';

const getInitials = (name: string): string => {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

function AvatarSection({ avatarUrl, name }: { avatarUrl: string | null; name: string }) {
  const [imgError, setImgError] = useState(false);
  const initials = getInitials(name || '?');

  if (avatarUrl && !imgError) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        className="h-24 w-24 rounded-full object-cover ring-4 ring-white shadow-md"
        onError={() => setImgError(true)}
      />
    );
  }

  return (
    <div
      className="h-24 w-24 rounded-full flex items-center justify-center text-3xl font-bold text-white ring-4 ring-white shadow-md"
      style={{ background: '#00284D' }}
    >
      {initials}
    </div>
  );
}

export function PublicProfilePage() {
  const { profileId } = useParams<{ profileId: string }>();
  const navigate = useNavigate();
  const { profile, isLoading, error, refetch } = usePublicProfile(profileId ?? '');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleStartChat = async () => {
    if (!profile) return;
    setChatLoading(true);
    setChatError(null);
    const result = await dmHttpService.getOrCreateConversation(profile.id);
    setChatLoading(false);
    if (result.success && result.data) {
      navigate(`/chat/dm/${result.data.id}`, {
        state: {
          partner: {
            id: profile.id,
            name: profile.full_name,
            avatarUrl: profile.avatar_url ?? undefined,
          },
        },
      });
    } else {
      setChatError(result.error ?? 'No se pudo iniciar la conversación.');
    }
  };

  const handleCopyPhone = async () => {
    if (!profile?.phone_number) return;
    try {
      await navigator.clipboard.writeText(profile.phone_number);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API not available — silently ignore
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24">
        <Loader2 size={32} className="animate-spin text-[#00284D]" />
        <p className="text-sm text-slate-500">Cargando perfil del compañero...</p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="flex flex-col items-center gap-4 py-24">
        <AlertCircle size={32} className="text-red-400" />
        <p className="text-sm text-red-500">{error ?? 'No se encontró el perfil.'}</p>
        <button
          type="button"
          onClick={() => void refetch()}
          className="rounded-lg px-5 py-2 text-sm font-medium text-white transition hover:opacity-90"
          style={{ background: '#00284D' }}
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

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Back header */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="rounded-lg p-1.5 text-slate-500 hover:bg-ink-100 transition"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-bold text-[#00284D]">Perfil del Compañero</h1>
      </div>

      {/* Profile header card */}
      <div className="rounded-xl border border-ink-100 bg-white p-6 shadow-sm">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
          <AvatarSection avatarUrl={profile.avatar_url} name={profile.full_name} />

          <div className="flex-1 text-center sm:text-left">
            <h2 className="text-2xl font-bold text-[#00284D]">{profile.full_name}</h2>
            {profile.career && (
              <p className="mt-0.5 text-sm text-slate-500">{profile.career}</p>
            )}
            {profile.semester != null && (
              <span
                className="mt-2 inline-block rounded-full px-3 py-0.5 text-xs font-bold uppercase tracking-wide"
                style={{ background: 'rgba(197,160,89,0.12)', color: '#C5A059' }}
              >
                Semestre {profile.semester}
              </span>
            )}
          </div>
        </div>

        {/* Send message button */}
        <div className="mt-5 border-t border-ink-100 pt-5">
          {chatError && (
            <p className="mb-3 flex items-center gap-2 text-sm text-red-500">
              <AlertCircle size={14} />
              {chatError}
            </p>
          )}
          <button
            type="button"
            onClick={() => void handleStartChat()}
            disabled={chatLoading}
            className="flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
            style={{ background: '#00284D' }}
          >
            {chatLoading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <MessageSquare size={16} />
            )}
            {chatLoading ? 'Abriendo conversación...' : 'Enviar mensaje'}
          </button>
        </div>
      </div>

      {/* Enrolled subjects */}
      {profile.subjects.length > 0 && (
        <div className="rounded-xl border border-ink-100 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen size={16} style={{ color: '#C5A059' }} />
            <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color: '#00284D' }}>
              Materias inscritas
            </h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {profile.subjects.map((subject) => (
              <span
                key={subject.id}
                className="rounded-full border px-3 py-1 text-xs font-medium text-[#00284D]"
                style={{ borderColor: 'rgba(0,40,77,0.2)', background: 'rgba(0,40,77,0.04)' }}
              >
                {subject.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Phone */}
      {profile.phone_number ? (
        <div className="rounded-xl border border-ink-100 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg"
                style={{ background: '#00284D' }}
              >
                <Phone size={18} style={{ color: '#C5A059' }} />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wide text-slate-400">Teléfono móvil</p>
                <p className="text-sm font-semibold text-[#00284D]">{profile.phone_number}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => void handleCopyPhone()}
              className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition hover:bg-ink-50"
              style={{ borderColor: 'rgba(0,40,77,0.2)', color: '#00284D' }}
              title="Copiar número"
            >
              <Copy size={13} />
              {copied ? 'Copiado' : 'Copiar'}
            </button>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-ink-100 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg"
              style={{ background: '#00284D' }}
            >
              <Phone size={18} style={{ color: '#C5A059' }} />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wide text-slate-400">Teléfono móvil</p>
              <p className="text-sm text-slate-400">No disponible</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
