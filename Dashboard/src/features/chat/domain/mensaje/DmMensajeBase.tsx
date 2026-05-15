import type { ReactNode } from 'react';
import type { IMensaje } from './IMensaje';

export class DmMensajeBase implements IMensaje {
  constructor(
    private readonly contenido: string,
    private readonly isOwn: boolean,
    private readonly timestamp: Date,
    private readonly extraMetadata: Record<string, unknown> = {},
  ) {}

  getContenido(): string {
    return this.contenido;
  }

  getMetadata(): Record<string, unknown> {
    return { isOwn: this.isOwn, timestamp: this.timestamp, ...this.extraMetadata };
  }

  render(): ReactNode {
    if (!this.contenido) return null;

    return (
      <div
        className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
          this.isOwn
            ? 'rounded-tr-sm bg-[#00284D] text-white'
            : 'rounded-tl-sm border border-ink-100 bg-white text-ink-900'
        }`}
        data-testid="dm-bubble"
      >
        <p className="whitespace-pre-wrap" data-testid="dm-contenido">
          {this.contenido}
        </p>
      </div>
    );
  }
}
