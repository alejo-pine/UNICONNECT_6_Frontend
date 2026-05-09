/**
 * Logger centralizado para el módulo de autenticación
 * En producción, estos logs no se mostrarán
 */

const IS_DEV = __DEV__;

export const authLogger = {
  info: (message: string, ...args: unknown[]) => {
    if (IS_DEV) {
      console.log(`[Auth] ${message}`, ...args);
    }
  },

  error: (message: string, error?: unknown) => {
    if (IS_DEV) {
      console.error(`[Auth Error] ${message}`, error);
    }
  },

  warn: (message: string, ...args: unknown[]) => {
    if (IS_DEV) {
      console.warn(`[Auth Warning] ${message}`, ...args);
    }
  },

  debug: (message: string, ...args: unknown[]) => {
    if (IS_DEV) {
      console.log(`[Auth Debug] ${message}`, ...args);
    }
  },
};
