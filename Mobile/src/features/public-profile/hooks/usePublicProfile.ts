/**
 * Custom hook para cargar perfil público de un estudiante
 * Evita antipatrones: lógica en componentes, useEffect sin dependencias correctas
 */
import { useCallback, useEffect, useState } from 'react';
import { useAuthStore } from '../../../store/authStore';
import { publicProfileHttpService } from '../services/publicProfileHttpService';
import { PublicProfile } from '../types/publicProfile';

interface UsePublicProfileReturn {
  profile: PublicProfile | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook para obtener el perfil público de un estudiante
 * @param profileId - ID del perfil a obtener
 * @returns Estado del perfil (datos, loading, error) y función para refetch
 */
export const usePublicProfile = (profileId: string): UsePublicProfileReturn => {
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { token } = useAuthStore();

  const fetchProfile = useCallback(async () => {
    if (!token) {
      setError('No hay sesión activa');
      setIsLoading(false);
      return;
    }

    if (!profileId) {
      setError('ID de perfil no proporcionado');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await publicProfileHttpService.getPublicProfile(profileId, token);

      if (response.success && response.data) {
        setProfile(response.data);
        setError(null);
      } else {
        setProfile(null);
        setError(response.error || 'Error al cargar el perfil');
      }
    } catch (err) {
      console.error('[usePublicProfile] Error inesperado:', err);
      setProfile(null);
      setError(err instanceof Error ? err.message : 'Error inesperado');
    } finally {
      setIsLoading(false);
    }
  }, [profileId, token]);

  // useEffect seguro con dependencias correctas
  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return {
    profile,
    isLoading,
    error,
    refetch: fetchProfile,
  };
};
