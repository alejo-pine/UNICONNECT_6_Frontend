import { useCallback, useEffect, useState } from 'react';
import { useAuthStore } from '@shared/store/authStore';
import { publicProfileHttpService } from '../../infrastructure/publicProfileHttpService';
import type { PublicProfile } from '../../domain/search';

export function usePublicProfile(profileId: string) {
  const token = useAuthStore((s) => s.token);

  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!token) {
      setError('No hay sesión activa.');
      setIsLoading(false);
      return;
    }
    if (!profileId) {
      setError('ID de perfil no proporcionado.');
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    const result = await publicProfileHttpService.getPublicProfile(profileId, token);
    if (result.success && result.data) {
      setProfile(result.data);
    } else {
      setProfile(null);
      setError(result.error ?? 'Error al cargar el perfil.');
    }
    setIsLoading(false);
  }, [profileId, token]);

  useEffect(() => {
    void fetchProfile();
  }, [fetchProfile]);

  return { profile, isLoading, error, refetch: fetchProfile };
}
