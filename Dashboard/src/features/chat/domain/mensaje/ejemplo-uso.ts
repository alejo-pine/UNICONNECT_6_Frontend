/**
 * Snippet de componibilidad — US-D01 / US-V04
 *
 * Demuestra que los cuatro decoradores se pueden encadenar libremente
 * sin modificar MensajeBase. No es un test; compila con `tsc --noEmit`.
 */
import {
  MensajeBase,
  MensajeConArchivo,
  MensajeConEncuesta,
  MensajeConMencion,
  MensajeConReaccion,
  type Reaccion,
} from './index';
import type { Poll } from '../wall';

// Ejemplo 1: mensaje de texto plano
const base = new MensajeBase(
  'Hola equipo, revisen el informe @user-002 y @user-003',
  'user-001',
  new Date('2026-05-06T22:00:00Z'),
);

// Ejemplo 2: texto + archivo adjunto
const conArchivo = new MensajeConArchivo(
  base,
  'https://storage.example.com/informe.pdf',
  'application/pdf',
  204800,
  'informe.pdf',
);

// Ejemplo 3: archivo + menciones
const conMencion = new MensajeConMencion(
  conArchivo,
  ['user-002', 'user-003'],
);

// Ejemplo 4: los tres decoradores encadenados
const reacciones: Reaccion[] = [
  { emoji: '👍', count: 3, users: ['user-002', 'user-003', 'user-004'] },
];
const completo = new MensajeConReaccion(conMencion, reacciones);

// Verificar que getContenido() y getMetadata() propagan por toda la cadena
const contenido: string = completo.getContenido();
const metadata: Record<string, unknown> = completo.getMetadata();

// Ejemplo 5 — US-V04: encuesta compuesta con los decoradores del Sprint 3
// MensajeConEncuesta se encadena con los decoradores existentes sin tocar MensajeBase.
const encuestaDePrueba: Poll = {
  id: 'poll-001',
  question: '¿Cuándo nos reunimos?',
  options: [
    { id: 'opt-1', text: 'Lunes', voteCount: 3, percentage: 60, votedByMe: false },
    { id: 'opt-2', text: 'Martes', voteCount: 2, percentage: 40, votedByMe: false },
  ],
  totalVotes: 5,
  closed: false,
};

const conEncuesta = new MensajeConEncuesta(
  conMencion,
  encuestaDePrueba,
  (pollId, optionId) => console.log('voto', pollId, optionId),
);

const metadataConEncuesta: Record<string, unknown> = conEncuesta.getMetadata();

export { base, conArchivo, conMencion, completo, contenido, metadata, conEncuesta, metadataConEncuesta };
