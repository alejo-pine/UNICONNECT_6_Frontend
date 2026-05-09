/**
 * Manejo centralizado de errores de autenticación
 */

import type { AuthError, AuthErrorType, AuthSessionResult } from '../types/auth.types';
import { getInstitutionalDomain } from './authValidation';

export function createAuthError(type: AuthErrorType, message: string, originalError?: Error): AuthError {
  return {
    type,
    message,
    originalError,
  };
}

export function handleAuthSessionError(result: AuthSessionResult): AuthError {
  if (result.type === 'dismiss' || result.type === 'cancel') {
    // Cancelación voluntaria del usuario - no es realmente un error
    return createAuthError(
      'AUTH_CANCELLED',
      'Login cancelado' // Mensaje simple, pero no se mostrará al usuario
    );
  }

  if (result.type === 'error') {
    return createAuthError(
      'UNKNOWN',
      result.error?.message ?? 'Error de autenticación.',
      result.error
    );
  }

  return createAuthError('AUTH_CANCELLED', 'El inicio de sesión fue cancelado.');
}

export function createInvalidDomainError(): AuthError {
  return createAuthError(
    'INVALID_DOMAIN',
    `Solo se permiten correos institucionales ${getInstitutionalDomain()}.`
  );
}

export function createNetworkError(originalError?: Error): AuthError {
  return createAuthError(
    'NETWORK_ERROR',
    'No fue posible conectar con el servidor. Verifica tu conexión a internet.',
    originalError
  );
}

export function createConfigError(missingVars: string[]): AuthError {
  return createAuthError(
    'CONFIG_MISSING',
    `Faltan variables de configuración: ${missingVars.join(', ')}`
  );
}
