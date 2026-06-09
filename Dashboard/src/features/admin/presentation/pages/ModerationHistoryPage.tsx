import { useEffect, useState, useCallback } from 'react';
import { moderationHistoryService } from '../../infrastructure/moderationHistoryService';
import type { ModerationRecord } from '../../domain/moderationHistory';

// ── Date helpers ──────────────────────────────────────────────────────────────

const fmt = new Intl.DateTimeFormat('es-CO', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: true,
  timeZone: 'America/Bogota',
});

const formatDate = (iso: string | null): string => {
  if (!iso) return '—';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : fmt.format(d);
};

const isBlockedNow = (blocked_until: string | null): boolean => {
  if (!blocked_until) return false;
  return new Date(blocked_until) > new Date();
};

/** "recent" = created in the last 24 hours */
const isRecent = (created_at: string): boolean => {
  const d = new Date(created_at);
  return !Number.isNaN(d.getTime()) && Date.now() - d.getTime() < 86_400_000;
};

// ── Statistics ────────────────────────────────────────────────────────────────

interface Stats {
  total: number;
  uniqueUsers: number;
  blockedNow: number;
  recentEvents: number;
  byCode: { code: string; count: number }[];
}

const computeStats = (records: ModerationRecord[]): Stats => {
  const users = new Set(records.map((r) => r.user_id));
  const codeCounts = new Map<string, number>();
  let blockedNow = 0;
  let recentEvents = 0;

  for (const r of records) {
    codeCounts.set(r.rejection_code, (codeCounts.get(r.rejection_code) ?? 0) + 1);
    if (isBlockedNow(r.blocked_until)) blockedNow++;
    if (isRecent(r.created_at)) recentEvents++;
  }

  const byCode = [...codeCounts.entries()]
    .map(([code, count]) => ({ code, count }))
    .sort((a, b) => b.count - a.count);

  return { total: records.length, uniqueUsers: users.size, blockedNow, recentEvents, byCode };
};

// ── Code badge ────────────────────────────────────────────────────────────────

const CODE_COLORS: Record<string, { bg: string; text: string }> = {
  SPAM_DETECTED: { bg: '#FEF3C7', text: '#92400E' },
  BAD_WORDS: { bg: '#FEE2E2', text: '#991B1B' },
  MO_001: { bg: '#FEE2E2', text: '#991B1B' },
  MO_002: { bg: '#FEE2E2', text: '#991B1B' },
  MO_003: { bg: '#FEF3C7', text: '#92400E' },
  MO_004: { bg: '#EDE9FE', text: '#5B21B6' },
};

const codeStyle = (code: string) =>
  CODE_COLORS[code] ?? { bg: '#E0F2FE', text: '#0369A1' };

function CodeBadge({ code }: { code: string }) {
  const { bg, text } = codeStyle(code);
  return (
    <span
      className="inline-block rounded-full px-2.5 py-0.5 text-xs font-bold tracking-wide"
      style={{ background: bg, color: text }}
    >
      {code}
    </span>
  );
}

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: number | string;
  icon: string;
  accent?: string;
}) {
  return (
    <div
      className="flex items-center gap-4 rounded-2xl border border-ink-100 bg-white p-5 shadow-card"
    >
      <div
        className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl"
        style={{ background: accent ?? '#EFF6FF' }}
      >
        <span
          className="material-symbols-outlined text-2xl"
          style={{ color: accent ? '#fff' : '#00284D', fontVariationSettings: "'FILL' 1" }}
        >
          {icon}
        </span>
      </div>
      <div>
        <p className="text-2xl font-bold text-[#00284D]">{value}</p>
        <p className="text-xs text-slate-500 mt-0.5">{label}</p>
      </div>
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <span
        className="material-symbols-outlined text-6xl mb-4"
        style={{ color: '#C3C6CF', fontVariationSettings: "'FILL' 1" }}
      >
        verified_user
      </span>
      <p className="text-lg font-semibold text-slate-600">Sin infracciones registradas</p>
      <p className="text-sm text-slate-400 mt-1">No hay historial de moderación disponible.</p>
    </div>
  );
}

// ── Error states ──────────────────────────────────────────────────────────────

function ErrorState({
  statusCode,
  message,
  onRetry,
}: {
  statusCode?: number;
  message: string;
  onRetry?: () => void;
}) {
  const is401 = statusCode === 401;
  const is403 = statusCode === 403;

  const icon = is403 ? 'lock' : is401 ? 'no_accounts' : 'error';
  const title = is403
    ? 'Acceso restringido'
    : is401
      ? 'Sesión no válida'
      : 'No se pudo cargar el historial';

  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div
        className="flex h-20 w-20 items-center justify-center rounded-full mb-5"
        style={{ background: is403 ? '#FEF3C7' : '#FEE2E2' }}
      >
        <span
          className="material-symbols-outlined text-4xl"
          style={{
            color: is403 ? '#92400E' : '#991B1B',
            fontVariationSettings: "'FILL' 1",
          }}
        >
          {icon}
        </span>
      </div>

      <p className="text-lg font-bold text-slate-700">{title}</p>

      {is403 || is401 ? (
        <p className="text-sm text-slate-500 mt-2 max-w-sm">{message}</p>
      ) : (
        <>
          <p className="text-sm text-slate-500 mt-2 max-w-sm">{message}</p>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="mt-5 flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition"
              style={{ background: '#00284D' }}
            >
              <span className="material-symbols-outlined text-base">refresh</span>
              Reintentar
            </button>
          )}
        </>
      )}
    </div>
  );
}

// ── Loading skeleton ──────────────────────────────────────────────────────────

function LoadingState() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 rounded-2xl bg-ink-100" />
        ))}
      </div>
      <div className="h-8 w-48 rounded-lg bg-ink-100" />
      <div className="rounded-2xl bg-ink-100">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="mx-5 my-3 h-10 rounded-lg bg-ink-200" />
        ))}
      </div>
    </div>
  );
}

// ── Table row ─────────────────────────────────────────────────────────────────

const SHORT_ID_LEN = 8;
const shortId = (id: string) => id.slice(0, SHORT_ID_LEN) + '…';

function TableRow({ record }: { record: ModerationRecord }) {
  const blocked = isBlockedNow(record.blocked_until);
  return (
    <tr className="border-b border-ink-100 hover:bg-ink-50 transition-colors">
      <td className="py-3 px-4">
        <span
          className="font-mono text-xs text-slate-600"
          title={record.user_id}
        >
          {shortId(record.user_id)}
        </span>
      </td>
      <td className="py-3 px-4">
        <CodeBadge code={record.rejection_code} />
      </td>
      <td className="py-3 px-4 text-sm text-slate-600 max-w-xs">
        <span className="line-clamp-2">{record.reason || '—'}</span>
      </td>
      <td className="py-3 px-4">
        {blocked ? (
          <span className="flex items-center gap-1 text-xs font-medium text-red-700">
            <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
              lock
            </span>
            {formatDate(record.blocked_until)}
          </span>
        ) : record.blocked_until ? (
          <span className="text-xs text-slate-400">{formatDate(record.blocked_until)}</span>
        ) : (
          <span className="text-xs text-slate-400">Sin bloqueo</span>
        )}
      </td>
      <td className="py-3 px-4 text-xs text-slate-500 whitespace-nowrap">
        {formatDate(record.created_at)}
      </td>
    </tr>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

type PageState =
  | { kind: 'loading' }
  | { kind: 'error'; message: string; statusCode?: number }
  | { kind: 'success'; records: ModerationRecord[] };

export function ModerationHistoryPage() {
  const [state, setState] = useState<PageState>({ kind: 'loading' });

  const load = useCallback(async () => {
    setState({ kind: 'loading' });
    const result = await moderationHistoryService.getHistory();
    if (result.success) {
      setState({ kind: 'success', records: result.data });
    } else {
      setState({ kind: 'error', message: result.error, statusCode: result.statusCode });
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (state.kind === 'loading') {
    return (
      <div className="max-w-6xl mx-auto">
        <PageHeader onRefresh={undefined} loading />
        <LoadingState />
      </div>
    );
  }

  if (state.kind === 'error') {
    const canRetry = state.statusCode !== 401 && state.statusCode !== 403;
    return (
      <div className="max-w-6xl mx-auto">
        <PageHeader onRefresh={undefined} loading={false} />
        <div className="rounded-2xl border border-ink-100 bg-white shadow-card">
          <ErrorState
            statusCode={state.statusCode}
            message={state.message}
            onRetry={canRetry ? load : undefined}
          />
        </div>
      </div>
    );
  }

  const { records } = state;
  const stats = computeStats(records);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <PageHeader onRefresh={load} loading={false} />

      {/* ── Stats cards ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Total de infracciones"
          value={stats.total}
          icon="gavel"
        />
        <StatCard
          label="Usuarios infractores únicos"
          value={stats.uniqueUsers}
          icon="group"
        />
        <StatCard
          label="Bloqueados actualmente"
          value={stats.blockedNow}
          icon="lock"
          accent={stats.blockedNow > 0 ? '#991B1B' : undefined}
        />
        <StatCard
          label="Eventos en últimas 24 h"
          value={stats.recentEvents}
          icon="schedule"
          accent={stats.recentEvents > 0 ? '#D4AF37' : undefined}
        />
      </div>

      {/* ── Code breakdown ───────────────────────────────────────── */}
      {stats.byCode.length > 0 && (
        <div className="rounded-2xl border border-ink-100 bg-white p-5 shadow-card">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">
            Infracciones por código
          </p>
          <div className="flex flex-wrap gap-2">
            {stats.byCode.map(({ code, count }) => (
              <div key={code} className="flex items-center gap-1.5">
                <CodeBadge code={code} />
                <span className="text-sm font-semibold text-slate-600">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Table ───────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-ink-100 bg-white shadow-card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-ink-100">
          <p className="font-semibold text-[#00284D]">Historial detallado</p>
          {records.length > 0 && (
            <p className="text-xs text-slate-400">{records.length} registro{records.length !== 1 ? 's' : ''}</p>
          )}
        </div>

        {records.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-ink-50 text-xs font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-4">Usuario (ID)</th>
                  <th className="py-3 px-4">Código</th>
                  <th className="py-3 px-4">Motivo</th>
                  <th className="py-3 px-4">Bloqueado hasta</th>
                  <th className="py-3 px-4">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r) => (
                  <TableRow key={r.id} record={r} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Page header ───────────────────────────────────────────────────────────────

function PageHeader({
  onRefresh,
  loading,
}: {
  onRefresh: (() => void) | undefined;
  loading: boolean;
}) {
  return (
    <div className="flex items-center justify-between mb-2">
      <div>
        <h1 className="text-2xl font-bold text-[#00284D]">Moderación administrativa</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Historial de infracciones · solo <span className="font-mono font-semibold">super_admin</span>
        </p>
      </div>
      {onRefresh && (
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="flex items-center gap-2 rounded-xl border border-ink-200 bg-white px-4 py-2 text-sm font-semibold text-[#00284D] shadow-sm transition hover:bg-ink-50 disabled:opacity-50"
        >
          <span
            className={`material-symbols-outlined text-base ${loading ? 'animate-spin' : ''}`}
          >
            refresh
          </span>
          Actualizar
        </button>
      )}
    </div>
  );
}
