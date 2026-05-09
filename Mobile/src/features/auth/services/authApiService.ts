/**
 * Servicio de API para sincronización con el backend
 * Responsabilidad: Comunicación HTTP con el backend de autenticación
 */

import type { AuthSession, AuthSyncResponse } from '../types/auth.types';
import { authLogger } from '../utils/logger';

/**
 * Parsea JSON de forma segura
 */
function safeParseJson<T>(value: string): T | null {
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function stripHtml(value: string): string {
  return value
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function resolveFriendlyBackendError(status: number, rawBody: string): string {
  const body = rawBody || '';
  const normalized = body.toLowerCase();

  if (status === 502 && (normalized.includes('ngrok') || normalized.includes('err_ngrok_8012'))) {
    return 'No se pudo conectar con el backend (ngrok 502). Verifica que el servidor API este encendido en el puerto configurado y que el tunel de ngrok siga activo.';
  }

  if (status === 502) {
    return 'El backend no esta respondiendo correctamente (HTTP 502). Intenta nuevamente en unos segundos.';
  }

  if (status >= 500) {
    return `El backend reporto un error interno (HTTP ${status}).`;
  }

  const plainText = stripHtml(body);
  if (plainText.length > 0 && plainText.length < 300) {
    return `Error al sincronizar usuario (${status}): ${plainText}`;
  } 

  return `Error al sincronizar usuario (${status}).`;
}

/**
 * Extrae la sesión del usuario desde la respuesta del backend
 */
function extractSessionFromResponse(payload: unknown): AuthSession | null {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const source = payload as AuthSyncResponse;
  const nestedCandidates = [source, source.data, source.user, source.profile].filter(
    Boolean
  ) as AuthSyncResponse[];

  for (const candidate of nestedCandidates) {
    const token = candidate.token ?? candidate.access_token;
    const userId =
      candidate.userId ?? candidate.user_id ?? candidate.profile_id ?? candidate.id;
    const rawNeedsOnboarding = candidate.needsOnboarding ?? candidate.needs_onboarding;
    const needsOnboarding =
      typeof rawNeedsOnboarding === 'boolean' ? rawNeedsOnboarding : false;

    if (token && userId) {
      return { token, userId, needsOnboarding };
    }
  }

  return null;
}

/**
 * Sincroniza el usuario autenticado con el backend
 */
export async function syncUserWithBackend(
  authSyncUrl: string,
  accessToken: string
): Promise<AuthSession> {
  authLogger.debug('Sincronizando usuario con backend');

  let response: Response;
  
  try {
    response = await fetch(authSyncUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    authLogger.error('Error de red al sincronizar con backend', error);
    throw new Error('No fue posible conectar con el backend para sincronizar la sesión.');
  }

  const rawBody = await response.text();
  const parsedBody = safeParseJson<unknown>(rawBody);

  if (response.status === 401) {
    throw new Error('Tu sesión no fue aceptada por el servidor. Inicia sesión nuevamente.');
  }

  if (!response.ok) {
    authLogger.error(`Error del backend: ${response.status}`, rawBody);
    throw new Error(resolveFriendlyBackendError(response.status, rawBody));
  }

  const session = extractSessionFromResponse(parsedBody);
  
  if (!session) {
    throw new Error(
      'Respuesta de auth/sync sin token o userId. Verifica el contrato del backend.'
    );
  }

  authLogger.info('Usuario sincronizado correctamente');
  
  return session;
}
