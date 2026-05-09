/**
 * Hook para manejar la lógica de guardado de perfil
 * Soluciona: Lógica en componente, Callback Hell
 */
import { useCallback, useState } from 'react';
import { profileHttpService } from '../../../services/profileHttpService';
import { useAuthStore } from '../../../store/authStore';
import { getErrorMessage, parseError } from '../../../utils/errorHandler';
import { ProfileData } from '../types/profile';

interface UseProfileSaveReturn {
  saving: boolean;
  error: string | null;
  saveProfile: (profile: ProfileData) => Promise<boolean>;
  clearError: () => void;
}

export const useProfileSave = (): UseProfileSaveReturn => {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { token, userId, triggerProfileRefresh } = useAuthStore();

  const saveProfile = useCallback(async (profile: ProfileData): Promise<boolean> => {
    if (!token || !userId) {
      const errorMsg = 'Sesion no disponible. Inicia sesion nuevamente.';
      setError(errorMsg);
      return false;
    }

    setSaving(true);
    setError(null);

    try {
      const { semester, phone_number, avatar_url } = profile;

      let persistedAvatarUrl = avatar_url || null;

      const isLocalAvatarUri =
        typeof avatar_url === 'string' &&
        (avatar_url.startsWith('file://') || avatar_url.startsWith('content://'));

      if (isLocalAvatarUri) {
        const uploadResponse = await profileHttpService.uploadAvatar(userId, avatar_url as string, token);
        if (!uploadResponse.success) {
          setError(uploadResponse.error || 'No se pudo subir el avatar.');
          return false;
        }

        persistedAvatarUrl = uploadResponse.data?.url || null;

        // Algunos backends suben correctamente pero no retornan la URL en el payload.
        if (!persistedAvatarUrl) {
          const refreshed = await profileHttpService.getProfileById(userId, token);
          if (refreshed.success && refreshed.data?.avatar_url) {
            persistedAvatarUrl = refreshed.data.avatar_url;
          }
        }

        if (!persistedAvatarUrl) {
          setError('La imagen se subio, pero el backend no retorno una URL publica del avatar.');
          return false;
        }
      }

      const datosParaBackend = {
        semester: semester || null,
        phone_number: phone_number || null,
        avatar_url: persistedAvatarUrl,
      };

      const response = await profileHttpService.updateProfile(userId, datosParaBackend, token);

      if (!response.success) {
        setError(response.error || 'No se pudo guardar el perfil.');
        return false;
      }

      triggerProfileRefresh();

      return true;
    } catch (err) {
      const appError = parseError(err);
      const errorMessage = getErrorMessage(appError);
      setError(errorMessage);
      return false;
    } finally {
      setSaving(false);
    }
  }, [token, userId, triggerProfileRefresh]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return { saving, error, saveProfile, clearError };
};
