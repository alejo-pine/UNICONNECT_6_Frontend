import type { ReactNode } from 'react';
import type { IMensaje } from './IMensaje';
import { MensajeDecorador } from './MensajeDecorador';
import type { Poll } from '../wall';

// Decorator concreto que añade la UI de encuesta al mensaje base.
// Se compone con los decoradores existentes del Sprint 3
// (MensajeConMencion, MensajeConArchivo, MensajeConReaccion) sin modificar
// la clase base ni MensajeDecorador.
export class MensajeConEncuesta extends MensajeDecorador {
  constructor(
    mensaje: IMensaje,
    private readonly poll: Poll,
    private readonly onVote: (pollId: string, optionId: string) => void,
    private readonly onClose?: (pollId: string) => void,
    private readonly onAlreadyVoted?: () => void,
  ) {
    super(mensaje);
  }

  override getMetadata(): Record<string, unknown> {
    return { ...this.wrapped.getMetadata(), poll: this.poll };
  }

  override render(): ReactNode {
    const hasVoted = this.poll.options.some((o) => o.votedByMe);
    const locked = this.poll.closed;
    const showResults = locked || hasVoted || this.poll.totalVotes > 0;
    const poll = this.poll;
    const onVote = this.onVote;
    const onClose = this.onClose;
    const onAlreadyVoted = this.onAlreadyVoted;

    return (
      <div data-testid="mensaje-con-encuesta">
        {this.wrapped.render()}
        <div className="ml-12 mt-3" data-testid="encuesta-bloque">
          <div className="rounded-xl border border-brand-100 bg-brand-50/40 p-4">
            <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-brand-600">
              <span aria-hidden="true">📊</span>
              <span>{poll.closed ? 'Encuesta cerrada' : 'Encuesta'}</span>
            </div>

            <p className="mb-3 text-sm font-semibold text-ink-900">{poll.question}</p>

            <div className="space-y-2">
              {poll.options.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    if (hasVoted) { onAlreadyVoted?.(); return; }
                    if (!locked) onVote(poll.id, opt.id);
                  }}
                  disabled={locked}
                  data-testid={`opcion-${opt.id}`}
                  className={[
                    'relative w-full overflow-hidden rounded-lg border px-3 py-2 text-left text-sm transition',
                    opt.votedByMe
                      ? 'border-brand-500 bg-brand-50 font-medium text-brand-900'
                      : locked
                        ? 'cursor-default border-ink-200 bg-white text-ink-700'
                        : 'cursor-pointer border-ink-200 bg-white text-ink-700 hover:border-brand-400 hover:bg-brand-50',
                  ].join(' ')}
                >
                  {showResults && (
                    <span
                      className="absolute inset-y-0 left-0 rounded-l-lg bg-brand-200/50 transition-all"
                      style={{ width: `${opt.percentage}%` }}
                      data-testid="barra-progreso"
                    />
                  )}
                  <span className="relative flex items-center justify-between gap-2">
                    <span className="truncate">{opt.text}</span>
                    {showResults && (
                      <span className="shrink-0 text-xs text-ink-500">{opt.percentage}%</span>
                    )}
                  </span>
                </button>
              ))}
            </div>

            <div className="mt-3 flex items-center justify-between">
              <p className="text-xs text-ink-400">
                {poll.totalVotes} {poll.totalVotes === 1 ? 'voto' : 'votos'}
              </p>
              {onClose && !poll.closed && (
                <button
                  type="button"
                  onClick={() => onClose(poll.id)}
                  className="text-xs text-ink-400 underline transition hover:text-red-500"
                  data-testid="cerrar-encuesta"
                >
                  Cerrar encuesta
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
}
