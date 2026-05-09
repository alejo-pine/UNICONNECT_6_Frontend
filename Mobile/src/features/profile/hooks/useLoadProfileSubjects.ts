/**
 * Hook para cargar las materias del perfil desde el backend
 * Soluciona: Lógica en componente, useEffect mal usado
 */
import { useCallback, useEffect, useState } from 'react';
import { Subject, profileHttpService } from '../../../services/profileHttpService';
import { getErrorMessage, parseError } from '../../../utils/errorHandler';

interface UseLoadProfileSubjectsReturn {
  subjects: Subject[];
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
}

export const useLoadProfileSubjects = (
  profileId: string,
  token: string
): UseLoadProfileSubjectsReturn => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    console.log('\n[useLoadProfileSubjects RELOAD] Verificando credenciales...');
    console.log('  profileId:', profileId, profileId ? '✓' : '✗');
    console.log('  token:', token ? '✓ Presente' : '✗ Falta');

    if (!profileId || !token) {
      const msg = 'Faltan credenciales para cargar materias';
      console.error('[useLoadProfileSubjects RELOAD] ✗', msg);
      setError(msg);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('[useLoadProfileSubjects RELOAD] Llamando a profileHttpService.getProfileSubjects...');
      const response = await profileHttpService.getProfileSubjects(profileId, token);

      console.log('\n[useLoadProfileSubjects RELOAD] Respuesta recibida:');
      console.log('  success:', response.success);
      console.log('  dataLength:', response.data?.length);
      console.log('data: ', response.data);
      console.log('  error:', response.error);

      if (response.success && response.data) {
        console.log('[useLoadProfileSubjects RELOAD] ✓ Éxito - Materias cargadas:', response.data.length);
        setSubjects(response.data);
      } else {
        const errorMsg = response.error || 'Error desconocido';
        console.error('[useLoadProfileSubjects RELOAD] ✗ Fallo:', errorMsg);
        setError(errorMsg);
        setSubjects([]);
      }
    } catch (err) {
      console.error('[useLoadProfileSubjects RELOAD] ✗ Excepción:', err);
      const appError = parseError(err);
      const errorMessage = getErrorMessage(appError);
      console.error('[useLoadProfileSubjects RELOAD] Error procesado:', errorMessage);
      setError(errorMessage);
      setSubjects([]);
    } finally {
      setLoading(false);
    }
  }, [profileId, token]);

  // Cargar materias al montar el componente
  useEffect(() => {
    // Early return si falta token (evita race condition en logout)
    if (!token) {
      console.log('[useLoadProfileSubjects] Early return: sin token');
      setLoading(false);
      return;
    }
    reload();
  }, [profileId, token, reload]);

  return { subjects, loading, error, reload };
};
