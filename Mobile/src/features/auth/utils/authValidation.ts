/**
 * Validaciones puras para autenticación
 */

const INSTITUTIONAL_DOMAIN = '@ucaldas.edu.co';

export function isValidInstitutionalEmail(email: string): boolean {
  if (!email || typeof email !== 'string') {
    return false;
  }
  return email.toLowerCase().trim().endsWith(INSTITUTIONAL_DOMAIN);
}

export function getInstitutionalDomain(): string {
  return INSTITUTIONAL_DOMAIN;
}

export function validateAuthConfig(config: {
  domain?: string;
  clientId?: string;
  authSyncUrl?: string;
}): { isValid: boolean; missing?: string[] } {
  const missing: string[] = [];

  if (!config.domain) missing.push('EXPO_PUBLIC_AUTH0_DOMAIN');
  if (!config.clientId) missing.push('EXPO_PUBLIC_AUTH0_CLIENT_ID');
  if (!config.authSyncUrl || config.authSyncUrl.trim().length === 0) {
    missing.push('EXPO_PUBLIC_AUTH_SYNC_URL');
  }

  return {
    isValid: missing.length === 0,
    missing: missing.length > 0 ? missing : undefined,
  };
}
