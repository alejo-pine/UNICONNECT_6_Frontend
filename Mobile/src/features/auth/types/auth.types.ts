/**
 * Tipos centralizados para el módulo de autenticación
 */

export type AuthErrorType =
  | 'AUTH_CANCELLED'
  | 'INVALID_DOMAIN'
  | 'NETWORK_ERROR'
  | 'TOKEN_EXCHANGE_FAILED'
  | 'BACKEND_SYNC_FAILED'
  | 'CONFIG_MISSING'
  | 'UNKNOWN';

export interface AuthError {
  type: AuthErrorType;
  message: string;
  originalError?: Error;
}

export interface Auth0UserInfo {
  email?: string;
  name?: string;
  sub?: string;
}

export interface AuthenticatedUser {
  auth0Id: string;
  email: string;
  name: string;
  userId: string;
  token: string;
  needsOnboarding: boolean;
}

export interface AuthSession {
  userId: string;
  token: string;
  needsOnboarding: boolean;
}

export interface AuthSyncResponse {
  token?: string;
  access_token?: string;
  userId?: string;
  user_id?: string;
  needsOnboarding?: boolean;
  needs_onboarding?: boolean;
  profile_id?: string;
  id?: string;
  data?: AuthSyncResponse;
  user?: AuthSyncResponse;
  profile?: AuthSyncResponse;
}

/**
 * Tipo simplificado del resultado de autenticación
 * Compatible con AuthSession.AuthSessionResult
 */
export type AuthSessionResult =
  | { type: 'success'; params: { code: string } }
  | { type: 'error'; error?: Error }
  | { type: 'cancel' | 'dismiss' | 'locked' | 'opened' };

export interface AuthConfig {
  domain: string;
  clientId: string;
  connection: string;
  audience?: string;
  redirectScheme: string;
  redirectUri?: string;
  authSyncUrl: string;
}
