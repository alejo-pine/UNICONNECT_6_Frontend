/**
 * Hook refactorizado para el login con Auth0
 * Responsabilidad: Coordinar el flujo de autenticación usando servicios separados
 */

import * as AuthSession from 'expo-auth-session';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { syncUserWithBackend } from '../services/authApiService';
import { exchangeCodeForToken, executeExpoGoAuthFlow, fetchAuth0UserInfo } from '../services/authService';
import type { AuthConfig, AuthenticatedUser, AuthError, AuthSessionResult } from '../types/auth.types';
import { createAuthError, createConfigError, createInvalidDomainError, handleAuthSessionError } from '../utils/authErrors';
import { isValidInstitutionalEmail, validateAuthConfig } from '../utils/authValidation';
import { authLogger } from '../utils/logger';

const AUTH_CALLBACK_PATH = 'auth/callback';

/**
 * Hook principal para autenticación
 */
export function useAuthLogin() {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Configuración de Auth0 desde variables de entorno
  const authConfig: Partial<AuthConfig> = useMemo(
    () => ({
      domain: process.env.EXPO_PUBLIC_AUTH0_DOMAIN,
      clientId: process.env.EXPO_PUBLIC_AUTH0_CLIENT_ID,
      connection: process.env.EXPO_PUBLIC_AUTH0_CONNECTION ?? 'google-oauth2',
      audience: process.env.EXPO_PUBLIC_AUTH0_AUDIENCE,
      redirectScheme: process.env.EXPO_PUBLIC_AUTH0_REDIRECT_SCHEME ?? 'uniconnect2',
      authSyncUrl: process.env.EXPO_PUBLIC_AUTH_SYNC_URL ?? '',
      redirectUri: process.env.EXPO_PUBLIC_AUTH0_REDIRECT_URI?.trim(),
    }),
    []
  );

  const configValidation = useMemo(
    () =>
      validateAuthConfig({
        domain: authConfig.domain,
        clientId: authConfig.clientId,
        authSyncUrl: authConfig.authSyncUrl,
      }),
    [authConfig.authSyncUrl, authConfig.clientId, authConfig.domain]
  );

  const hasValidConfig = configValidation.isValid;
  const configMissingVars = useMemo(
    () => configValidation.missing ?? [],
    [configValidation.missing]
  );

  // Detectar si estamos en Expo Go
  const isExpoGo = useMemo(
    () =>
      Constants.executionEnvironment === ExecutionEnvironment.StoreClient ||
      Constants.appOwnership === 'expo',
    []
  );

  // Generar el nombre del proyecto para el proxy de Expo
  const projectNameForProxy = useMemo(() => {
    const owner = Constants.expoConfig?.owner;
    const slug = Constants.expoConfig?.slug;

    if (owner && slug) {
      return `@${owner}/${slug}`;
    }

    return undefined;
  }, []);

  // URIs para el proxy de Expo Go
  const expoProxyRedirectUri = useMemo(() => {
    if (!projectNameForProxy) {
      return undefined;
    }
    return `https://auth.expo.io/${projectNameForProxy}`;
  }, [projectNameForProxy]);

  const expoProxyReturnUri = useMemo(() => {
    if (!isExpoGo) {
      return undefined;
    }
    return AuthSession.makeRedirectUri({ path: 'expo-auth-session' });
  }, [isExpoGo]);

  // Calcular la redirectUri final
  const redirectUri = useMemo(() => {
    const explicitUri = authConfig.redirectUri;
    
    if (explicitUri && explicitUri.toLowerCase() !== 'auto') {
      return explicitUri;
    }

    if (isExpoGo) {
      if (expoProxyRedirectUri) {
        return expoProxyRedirectUri;
      }
      authLogger.warn('No se encontró owner/slug. Usando redirectUri con scheme.');
    }

    return AuthSession.makeRedirectUri({
      scheme: authConfig.redirectScheme,
      path: AUTH_CALLBACK_PATH,
    });
  }, [authConfig.redirectUri, authConfig.redirectScheme, expoProxyRedirectUri, isExpoGo]);

  // Discovery endpoints de Auth0
  const discovery = useMemo(() => {
    if (!authConfig.domain) {
      return null;
    }

    return {
      authorizationEndpoint: `https://${authConfig.domain}/authorize`,
      tokenEndpoint: `https://${authConfig.domain}/oauth/token`,
      userInfoEndpoint: `https://${authConfig.domain}/userinfo`,
    };
  }, [authConfig.domain]);

  // Request de autenticación
  const [request, , promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: authConfig.clientId ?? '',
      redirectUri,
      responseType: AuthSession.ResponseType.Code,
      usePKCE: true,
      scopes: ['openid', 'profile', 'email'],
      extraParams: {
        connection: authConfig.connection ?? 'google-oauth2',
        prompt: 'select_account',
        ...(authConfig.audience ? { audience: authConfig.audience } : {}),
      },
    },
    discovery
  );

  useEffect(() => {
    authLogger.info('redirectUri configurado', redirectUri);
  }, [redirectUri]);

  /**
   * Ejecuta el flujo de autenticación para Expo Go
   */
  const runExpoGoAuthFlow = useCallback(async (): Promise<AuthSessionResult> => {
    if (!expoProxyRedirectUri || !expoProxyReturnUri) {
      throw createConfigError(['owner/slug en app.json']);
    }

    if (!request?.url) {
      throw createAuthError('CONFIG_MISSING', 'La URL de autorización aún no está lista. Intenta de nuevo.');
    }

    return executeExpoGoAuthFlow({
      proxyRedirectUri: expoProxyRedirectUri,
      proxyReturnUri: expoProxyReturnUri,
      authRequestUrl: request.url,
      parseReturnUrl: (url: string) => request.parseReturnUrl(url) as AuthSessionResult,
    });
  }, [expoProxyRedirectUri, expoProxyReturnUri, request]);

  /**
   * Manejador principal del login
   */
  const handleLogin = useCallback(async (): Promise<AuthenticatedUser | null> => {
    try {
      setIsLoading(true);
      setErrorMessage(null);

      // Validar configuración
      if (!hasValidConfig) {
        throw createConfigError(configMissingVars);
      }

      if (!discovery || !request) {
        throw createAuthError('CONFIG_MISSING', 'La configuración de Auth0 aún no está lista.');
      }

      // Ejecutar flujo de autenticación
      authLogger.info('Iniciando flujo de autenticación');
      const authResult = isExpoGo ? await runExpoGoAuthFlow() : await promptAsync();

      // Manejar resultado
      if (authResult.type !== 'success') {
        throw handleAuthSessionError(authResult as AuthSessionResult);
      }

      const code = authResult.params.code;
      if (!code) {
        throw createAuthError('TOKEN_EXCHANGE_FAILED', 'No se recibió código de autorización.');
      }

      if (!request.codeVerifier) {
        throw createAuthError('TOKEN_EXCHANGE_FAILED', 'No se encontró code verifier para PKCE.');
      }

      // Intercambiar código por token
      const accessToken = await exchangeCodeForToken({
        clientId: authConfig.clientId!,
        code,
        redirectUri,
        codeVerifier: request.codeVerifier,
        tokenEndpoint: discovery.tokenEndpoint,
      });

      // Obtener información del usuario
      const userInfo = await fetchAuth0UserInfo(accessToken, discovery.userInfoEndpoint);

      const { email, name, sub } = userInfo;

      if (!email || !name || !sub) {
        throw createAuthError('BACKEND_SYNC_FAILED', 'No fue posible obtener email, name y sub desde /userinfo.');
      }

      // Validar dominio institucional
      if (!isValidInstitutionalEmail(email)) {
        throw createInvalidDomainError();
      }

      // Sincronizar con backend
      const session = await syncUserWithBackend(authConfig.authSyncUrl!, accessToken);

      authLogger.info('Login exitoso');

      return {
        auth0Id: sub,
        email,
        name,
        userId: session.userId,
        token: session.token,
        needsOnboarding: session.needsOnboarding,
      };
    } catch (error) {
      const authError = error as AuthError;
      
      // Si el usuario cancela voluntariamente, solo volver al estado inicial
      if (authError.type === 'AUTH_CANCELLED') {
        authLogger.info('Login cancelado por el usuario');
        return null; // No mostrar mensaje de error, solo retornar al estado inicial
      }
      
      // Para errores de validación de dominio, mostrar warning (no error rojo)
      if (authError.type === 'INVALID_DOMAIN') {
        authLogger.warn('Validación de dominio', authError.message);
      } else {
        // Errores de sistema - sí mostrar en LogBox
        authLogger.error('Error en el login', error);
      }

      // Construir mensaje de error para mostrar al usuario
      let errorMsg: string;

      if (authError.type) {
        errorMsg = authError.message;
      } else if (error instanceof Error) {
        errorMsg = error.message;
      } else {
        errorMsg = 'Ocurrió un error en el inicio de sesión.';
      }

      setErrorMessage(errorMsg);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [
    authConfig,
    configMissingVars,
    discovery,
    hasValidConfig,
    isExpoGo,
    promptAsync,
    redirectUri,
    request,
    runExpoGoAuthFlow,
  ]);

  return {
    isLoading,
    errorMessage,
    canLogin: Boolean(request) && Boolean(discovery) && hasValidConfig && !isLoading,
    loginUnavailableReason: !hasValidConfig
      ? `Configuración incompleta: ${configValidation.missing?.join(', ')}`
      : !request || !discovery
        ? 'Inicializando autenticación...'
        : null,
    redirectUri,
    handleLogin,
  };
}
