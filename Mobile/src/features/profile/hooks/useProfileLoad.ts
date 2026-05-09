/**
 * Hook para manejar la carga de perfil
 * Soluciona: Lógica en componente, useEffect mal usado
 */
import { useCallback, useEffect, useState } from 'react';
import { profileService } from '../../../services/profileService';
import { useAuthStore } from '../../../store/authStore';
import { getErrorMessage, parseError } from '../../../utils/errorHandler';
import { ProfileData } from '../types/profile';

interface UseProfileLoadReturn {
  profile: ProfileData | null;
  loading: boolean;
  error: string | null;
  loadProfile: () => Promise<void>;
}

export const useProfileLoad = (): UseProfileLoadReturn => {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { token, userId } = useAuthStore();

  const loadProfile = useCallback(async () => {
    if (!token || !userId) {
      setError('Sesion no disponible. Inicia sesion nuevamente.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await profileService.getProfileById(userId, token);

      if (response.success && response.data) {
        setProfile(response.data);
      } else {
        const appError = parseError({ message: response.error });
        const errorMessage = getErrorMessage(appError);
        setError(errorMessage);
      }
    } catch (err) {
      const appError = parseError(err);
      const errorMessage = getErrorMessage(appError);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [token, userId]);

  // Cargar perfil solamente por primera vez
  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  return { profile, loading, error, loadProfile };
};
