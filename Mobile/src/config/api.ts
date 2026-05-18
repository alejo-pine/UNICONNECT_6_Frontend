import Constants from "expo-constants";

const DEFAULT_API_PORT = "3000";
const DEFAULT_API_PATH = "/api";
const DEFAULT_CHAT_PORT = "3004";

const normalizeUrl = (value: string) => value.trim().replace(/\/+$/, "");

function ensureApiPath(rawUrl: string): string {
  try {
    const parsed = new URL(rawUrl);
    const normalizedPath = parsed.pathname.replace(/\/+$/, "");

    if (!normalizedPath || normalizedPath === "") {
      parsed.pathname = DEFAULT_API_PATH;
      return parsed.toString().replace(/\/+$/, "");
    }

    if (normalizedPath === "/") {
      parsed.pathname = DEFAULT_API_PATH;
      return parsed.toString().replace(/\/+$/, "");
    }

    return rawUrl;
  } catch {
    return rawUrl;
  }
}

export function getApiBaseUrl(): string {
  const envBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
  if (envBaseUrl && envBaseUrl.trim().length > 0) {
    return normalizeUrl(envBaseUrl);
  }

  const backendPublicUrl = process.env.BACKEND_PUBLIC_URL;
  if (backendPublicUrl && backendPublicUrl.trim().length > 0) {
    return normalizeUrl(ensureApiPath(backendPublicUrl));
  }

  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const host = hostUri.split(":")[0];
    return `http://${host}:${DEFAULT_API_PORT}${DEFAULT_API_PATH}`;
  }

  console.warn('[apiConfig] No hay URL de backend configurada. Define EXPO_PUBLIC_API_BASE_URL o BACKEND_PUBLIC_URL en .env.');
  return `http://localhost:${DEFAULT_API_PORT}${DEFAULT_API_PATH}`;
}

export function getChatServiceUrl(): string {
  const envBaseUrl = process.env.EXPO_PUBLIC_CHAT_SERVICE_URL;

  // Si la variable de entorno NO usa localhost, respetarla.
  if (
    envBaseUrl &&
    envBaseUrl.trim().length > 0 &&
    !envBaseUrl.includes("localhost") &&
    !envBaseUrl.includes("127.0.0.1")
  ) {
    return normalizeUrl(envBaseUrl);
  }

  // MAGIA PARA EXPO GO (LAN): Extrae automáticamente la IP de tu PC
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const host = hostUri.split(":")[0]; // IP local dev
    return `http://${host}:${DEFAULT_CHAT_PORT}`;
  }

  console.warn(
    "[apiConfig] Fallback al localhost para el chat. Si usas app compilada física, fallará.",
  );
  return `http://10.0.2.2:${DEFAULT_CHAT_PORT}`; // Fallback adicional para Emulador Android nativo
}

export const API_BASE_URL = getApiBaseUrl();

/**
 * Returns the base URL for Socket.IO connections (no /api path).
 * Uses the same host detection as getApiBaseUrl() so it works on
 * physical devices, emulators, and ngrok tunnels alike.
 */
export function getSocketBaseUrl(): string {
  // Explicit socket URL override
  const explicit = process.env.EXPO_PUBLIC_SOCKET_URL;
  if (explicit && explicit.trim().length > 0) return explicit.trim().replace(/\/+$/, '');

  // Explicit backend URL without /api suffix
  const backendPublicUrl = process.env.BACKEND_PUBLIC_URL;
  if (backendPublicUrl && backendPublicUrl.trim().length > 0) {
    // Strip any trailing /api to get the socket root
    return backendPublicUrl.trim().replace(/\/api\/?$/, '').replace(/\/+$/, '');
  }

  // EXPO_PUBLIC_API_BASE_URL - strip /api suffix
  const envBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
  if (envBaseUrl && envBaseUrl.trim().length > 0) {
    return envBaseUrl.trim().replace(/\/api\/?$/, '').replace(/\/+$/, '');
  }

  // Auto-detect LAN IP from Expo (works on physical devices connected to same network)
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const host = hostUri.split(':')[0];
    return `http://${host}:${DEFAULT_API_PORT}`;
  }

  return `http://10.0.2.2:${DEFAULT_API_PORT}`;
}

export const SOCKET_BASE_URL = getSocketBaseUrl();
