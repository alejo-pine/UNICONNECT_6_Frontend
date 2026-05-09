/**
 * Hook personalizado para crear un grupo de estudio
 * Responsabilidad: Lógica de validación, carga HTTP y manejo de errores
 * Separación de responsabilidades: La vista solo llama al hook
 */

import { useAuthStore } from '@/src/store/authStore';
import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import { groupsHttpService } from '../services/groupsHttpService';
import type { StudyGroupCreatePayload } from '../types/groups';

interface UseCreateStudyGroupState {
  isLoading: boolean;
  error: string | null;
}

interface UseCreateStudyGroupReturn extends UseCreateStudyGroupState {
  createGroup: (payload: StudyGroupCreatePayload) => Promise<string | null>;
}

/**
 * Hook para crear un nuevo grupo de estudio
 *
 * Flujo:
 * 1. Valida que los campos obligatorios no estén vacíos
 * 2. Muestra AlertBox de validación si es necesario
 * 3. Deshabilita el botón durante la petición HTTP
 * 4. Si éxito (201): retorna el ID del grupo creado
 * 5. Si error: muestra AlertBox con el mensaje de error
 */
export const useCreateStudyGroup = (): UseCreateStudyGroupReturn => {
  const { token } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createGroup = useCallback(
    async (payload: StudyGroupCreatePayload): Promise<string | null> => {
      // Validar que todos los campos obligatorios estén presentes
      if (!payload.name?.trim() || !payload.description?.trim() || !payload.subject_id?.trim()) {
        Alert.alert(
          'Campos Obligatorios',
          'Por favor completa todos los campos: nombre, descripción y materia.'
        );
        return null;
      }

      // Validar que existe token de autenticación
      if (!token) {
        Alert.alert(
          'Error de Autenticación',
          'No se encontró sesión activa. Por favor inicia sesión nuevamente.'
        );
        return null;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await groupsHttpService.createGroup(payload, token);

        if (response.success && response.data) {
          // Extraer ID del grupo creado, soportando respuestas anidadas
          const maybeData = response.data as unknown as {
            id?: string;
            data?: { id?: string };
          };
          const createdId = maybeData.data?.id ?? maybeData.id ?? null;

          if (createdId) {
            setIsLoading(false);
            return createdId;
          }

          setIsLoading(false);
          const missingIdMessage = 'No se recibió el ID del grupo creado.';
          setError(missingIdMessage);
          Alert.alert('Error al Crear Grupo', missingIdMessage);
          return null;
        } else {
          // Error desde el backend
          const errorMessage = response.error || 'Error desconocido al crear el grupo';
          setError(errorMessage);
          setIsLoading(false);

          Alert.alert('Error al Crear Grupo', errorMessage);
          return null;
        }
      } catch (err) {
        // Error de excepción
        console.error('[useCreateStudyGroup] Error:', err);
        const errorMessage = 'Error inesperado al crear el grupo. Intenta nuevamente.';
        setError(errorMessage);
        setIsLoading(false);

        Alert.alert('Error', errorMessage);
        return null;
      }
    },
    [token]
  );

  return {
    isLoading,
    error,
    createGroup,
  };
};
