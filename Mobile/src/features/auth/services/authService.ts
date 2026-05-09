/**
 * Servicio de autenticación con Auth0
 * Responsabilidad: Manejar el flujo de OAuth, exchange de tokens, obtención de user info
 */

import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';

import type { Auth0UserInfo, AuthSessionResult } from '../types/auth.types';
import { authLogger } from '../utils/logger';

WebBrowser.maybeCompleteAuthSession();

export interface ExpoGoAuthFlowParams {
  proxyRedirectUri: string;
  proxyReturnUri: string;
  authRequestUrl: string;
  parseReturnUrl: (url: string) => AuthSessionResult;
}

export interface TokenExchangeParams {
  clientId: string;
  code: string;
  redirectUri: string;
  codeVerifier: string;
  tokenEndpoint: string;
}

/**
 * Ejecuta el flujo de autenticación específico para Expo Go
 */
export async function executeExpoGoAuthFlow(params: ExpoGoAuthFlowParams): Promise<AuthSessionResult> {
  const { proxyRedirectUri, proxyReturnUri, authRequestUrl, parseReturnUrl } = params;

  const startParams = new URLSearchParams({
    authUrl: authRequestUrl,
    returnUrl: proxyReturnUri,
  });

  const startUrl = `${proxyRedirectUri}/start?${startParams.toString()}`;
  
  authLogger.debug('Iniciando flujo Expo Go', { startUrl });

  const browserResult = await WebBrowser.openAuthSessionAsync(startUrl, proxyReturnUri);

  if (browserResult.type !== 'success') {
    return { type: browserResult.type } as AuthSessionResult;
  }

  return parseReturnUrl(browserResult.url);
}

/**
 * Intercambia el código de autorización por un access token
 */
export async function exchangeCodeForToken(params: TokenExchangeParams): Promise<string> {
  const { clientId, code, redirectUri, codeVerifier, tokenEndpoint } = params;

  authLogger.debug('Intercambiando código por token');

  const tokenResponse = await AuthSession.exchangeCodeAsync(
    {
      clientId,
      code,
      redirectUri,
      extraParams: {
        code_verifier: codeVerifier,
      },
    },
    { tokenEndpoint }
  );

  const accessToken = tokenResponse.accessToken;
  
  if (!accessToken) {
    throw new Error('No se obtuvo un access token válido desde Auth0.');
  }

  return accessToken;
}

/**
 * Obtiene la información del usuario desde Auth0
 */
export async function fetchAuth0UserInfo(
  accessToken: string,
  userInfoEndpoint: string
): Promise<Auth0UserInfo> {
  authLogger.debug('Obteniendo información de usuario desde Auth0');

  const userInfo = (await AuthSession.fetchUserInfoAsync(
    { accessToken },
    { userInfoEndpoint }
  )) as Auth0UserInfo;

  return userInfo;
}

