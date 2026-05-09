import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import { profileHttpService, type Subject } from '../../../services/profileHttpService';
import { useAuthStore } from '../../../store/authStore';
import { completeOnboarding, OnboardingApiError } from '../../onboarding/services/onboardingService';
import { useLoadAvailableSubjects } from './useLoadAvailableSubjects';
import { useLoadProfileSubjects } from './useLoadProfileSubjects';
import { useSubjectsManager } from './useSubjectsManager';
import { useSubjectsSave } from './useSubjectsSave';

export const useSubjectsUpdateController = (isOnboarding = false) => {
  const router = useRouter();
  const params = useLocalSearchParams();

  const [addingSubjectIds, setAddingSubjectIds] = useState<Set<string>>(new Set());
  const [removingSubjectIds, setRemovingSubjectIds] = useState<Set<string>>(new Set());
  const [addingError, setAddingError] = useState<string | null>(null);

  const { token, userId, setNeedsOnboarding, setOnboardingResolved, clearSession } = useAuthStore();
  const profileId = userId || '';

  const {
    subjects: profileSubjects,
    loading: loadingProfile,
    error: errorProfile,
    reload: reloadProfile,
  } = useLoadProfileSubjects(profileId, token || '');

  const selectedCareer = useMemo(
    () => (typeof params.career === 'string' ? params.career : '').trim(),
    [params.career]
  );

  const {
    subjects: availableSubjects,
    loading: loadingAvailable,
    error: errorAvailable,
    reload: reloadAvailable,
  } = useLoadAvailableSubjects(token || '', {
    career: selectedCareer || undefined,
    program: selectedCareer || undefined,
    limit: 100,
  });

  const availableSubjectsByCareer = useMemo(() => {
    if (!selectedCareer) {
      return [];
    }

    return availableSubjects;
  }, [availableSubjects, selectedCareer]);

  const emptySuggestionMessage = useMemo(() => {
    if (!selectedCareer) {
      if (!isOnboarding) {
        return 'No se pudo identificar tu carrera de perfil.';
      }

      return 'No se pudo identificar tu carrera. Regresa al paso anterior e intentalo de nuevo.';
    }

    if (availableSubjectsByCareer.length === 0) {
      return 'No hay materias registradas para la carrera seleccionada.';
    }

    return 'Todas las materias estan agregadas';
  }, [availableSubjectsByCareer.length, isOnboarding, selectedCareer]);

  const initialSubjects = useMemo(() => {
    if (profileSubjects.length > 0) {
      return profileSubjects;
    }

    try {
      if (params.initialSubjects) {
        return JSON.parse(params.initialSubjects as string) as Subject[];
      }
    } catch {
      console.error('Error al parsear subjects iniciales');
    }

    return [];
  }, [params.initialSubjects, profileSubjects]);

  const {
    currentSubjects,
    filteredSubjects,
    searchQuery,
    addSubject,
    removeSubject,
    setSearchQuery,
  } = useSubjectsManager(initialSubjects, availableSubjectsByCareer);

  const { saving, error: savingError, clearError } = useSubjectsSave();

  const handleGoBack = useCallback(() => {
    if (isOnboarding) {
      const career = typeof params.career === 'string' ? params.career : '';
      const semester = typeof params.semester === 'string' ? params.semester : '';
      const phoneNumber = typeof params.phoneNumber === 'string' ? params.phoneNumber : '';

      router.replace({
        pathname: '/(onboarding)/complete-profile',
        params: {
          career,
          semester,
          phoneNumber,
        },
      });
      return;
    }

    router.back();
  }, [isOnboarding, params.career, params.phoneNumber, params.semester, router]);

  const handleRetry = useCallback(async () => {
    console.log('[SubjectsUpdateScreen] Reintentando carga...');
    await reloadProfile();
    await reloadAvailable();
  }, [reloadAvailable, reloadProfile]);

  const handleAddSubject = useCallback(
    async (subject: Subject) => {
      if (!token || !profileId) {
        setAddingError('Credenciales no disponibles');
        return;
      }

      addSubject(subject);
      setAddingSubjectIds((prev) => new Set([...prev, subject.id]));
      setAddingError(null);

      try {
        const response = await profileHttpService.addSubjectToProfile(profileId, subject.id, token);

        if (!response.success) {
          removeSubject(subject.id);
          const errorMessage = response.error || 'Error al agregar materia';
          setAddingError(errorMessage);
          Alert.alert('Error', errorMessage);
        }
      } catch (error) {
        removeSubject(subject.id);
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
        setAddingError(errorMessage);
        Alert.alert('Error', errorMessage);
      } finally {
        setAddingSubjectIds((prev) => {
          const next = new Set(prev);
          next.delete(subject.id);
          return next;
        });
      }
    },
    [addSubject, profileId, removeSubject, token]
  );

  const handleRemoveSubject = useCallback(
    async (subjectId: string) => {
      if (!token || !profileId) {
        setAddingError('Credenciales no disponibles');
        return;
      }

      removeSubject(subjectId);
      setRemovingSubjectIds((prev) => new Set([...prev, subjectId]));
      setAddingError(null);

      try {
        const response = await profileHttpService.removeSubjectFromProfile(profileId, subjectId, token);

        if (!response.success) {
          const subjectToRestore = profileSubjects.find((subject) => subject.id === subjectId);
          if (subjectToRestore) {
            addSubject(subjectToRestore);
          }
          const errorMessage = response.error || 'Error al eliminar materia';
          setAddingError(errorMessage);
          Alert.alert('Error', errorMessage);
        }
      } catch (error) {
        const subjectToRestore = profileSubjects.find((subject) => subject.id === subjectId);
        if (subjectToRestore) {
          addSubject(subjectToRestore);
        }
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
        setAddingError(errorMessage);
        Alert.alert('Error', errorMessage);
      } finally {
        setRemovingSubjectIds((prev) => {
          const next = new Set(prev);
          next.delete(subjectId);
          return next;
        });
      }
    },
    [addSubject, profileId, profileSubjects, removeSubject, token]
  );

  const handleSave = useCallback(async () => {
    if (currentSubjects.length === 0) {
      setAddingError('Debes agregar al menos una materia para continuar.');
      return;
    }

    setAddingError(null);

    if (!isOnboarding) {
      router.back();
      return;
    }

    if (!token) {
      router.replace('/login');
      return;
    }

    try {
      await completeOnboarding(token, false);
      setNeedsOnboarding(false);
      setOnboardingResolved(true);
      router.replace('/(tabs)');
    } catch (error) {
      if (error instanceof OnboardingApiError && error.status === 401) {
        await clearSession();
        router.replace('/login');
        return;
      }

      Alert.alert('No se pudo finalizar', 'Se guardaron materias, pero no se pudo cerrar onboarding.');
    }
  }, [
    clearSession,
    currentSubjects.length,
    isOnboarding,
    router,
    setNeedsOnboarding,
    setOnboardingResolved,
    token,
  ]);

  return {
    currentSubjects,
    filteredSubjects,
    searchQuery,
    setSearchQuery,
    emptySuggestionMessage,
    addingSubjectIds,
    removingSubjectIds,
    addingError,
    setAddingError,
    saving,
    savingError,
    clearError,
    handleGoBack,
    handleRetry,
    handleAddSubject,
    handleRemoveSubject,
    handleSave,
    isLoading: loadingProfile || loadingAvailable,
    loadError: errorProfile,
    errorProfile,
    errorAvailable,
  };
};
