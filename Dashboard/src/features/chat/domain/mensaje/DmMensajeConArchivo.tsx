import type { ReactNode } from 'react';
import type { IMensaje } from './IMensaje';
import { MensajeDecorador } from './MensajeDecorador';

export class DmMensajeConArchivo extends MensajeDecorador {
  constructor(
    mensaje: IMensaje,
    private readonly nombreArchivo: string,
  ) {
    super(mensaje);
  }

  override render(): ReactNode {
    return (
      <div data-testid="dm-mensaje-con-archivo">
        {this.wrapped.render()}
        <p className="mt-1 text-xs opacity-70" data-testid="dm-archivo-nombre">
          {this.nombreArchivo}
        </p>
      </div>
    );
  }
}
