import { useAuthStore } from '@/src/store/authStore';
import { useCallback } from 'react';

import { authLogger } from '../utils/logger';

export function useLogout() {
  const { clearSession } = useAuthStore();

  const handleLogout = useCallback(async () => {
    try {
      // Al borrar la sesión, el token pasa a null.
      // El useEffect del RootLayout lo detectará y te mandará al login al instante.
      await clearSession();
      authLogger.info('Sesión cerrada correctamente');
    } catch (error) {
      authLogger.error('Error al limpiar sesión', error);
    }
  }, [clearSession]);

  return { handleLogout };
}