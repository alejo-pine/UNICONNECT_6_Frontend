/**
 * Ruta: /study-groups/create
 * Pantalla para crear un nuevo grupo de estudio
 */

import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useEffect } from 'react';
import {
    ActivityIndicator,
    Alert,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CreateGroupForm } from '@/src/features/groups/components/CreateGroupForm';
import { groupsColors } from '@/src/features/groups/constants/colors';
import { useCreateStudyGroup } from '@/src/features/groups/hooks/useCreateStudyGroup';
import { useUserSubjects } from '@/src/features/groups/hooks/useUserSubjects';
import type { StudyGroupCreatePayload } from '@/src/features/groups/types/groups';
import { useAuthStore } from '@/src/store/authStore';

const colors = groupsColors;

export default function CreateStudyGroupScreen() {
  useAuthStore();

  // Hook para cargar materias del usuario
  const { subjects, loading: isLoadingSubjects, error: subjectsError } = useUserSubjects();

  // Hook para crear el grupo
  const { isLoading, createGroup } = useCreateStudyGroup();

  // Manejar éxito de creación
  const handleSubmitGroup = useCallback(
    async (payload: StudyGroupCreatePayload) => {
      const groupId = await createGroup(payload);

      if (groupId) {
        const selectedSubjectName =
          subjects.find((subject) => String(subject.id) === String(payload.subject_id))?.name ??
          'Sin materia';
        Alert.alert('Éxito', 'El grupo fue creado correctamente', [
          {
            text: 'OK',
            onPress: () => {
              const encodedName = encodeURIComponent(payload.name);
              const encodedSubjectName = encodeURIComponent(selectedSubjectName);
              const encodedDescription = encodeURIComponent(payload.description ?? '');

              router.replace(
                `/study-groups/${groupId}?name=${encodedName}&subjectName=${encodedSubjectName}&description=${encodedDescription}&isAdmin=true&isMember=true`
              );
            },
          },
        ]);
      }
    },
    [createGroup, subjects]
  );

  // Log de debug
  useEffect(() => {
    console.log('[CreateStudyGroupScreen] Estado:', {
      isLoading: isLoadingSubjects,
      subjectsCount: subjects.length,
      error: subjectsError,
    });
  }, [isLoadingSubjects, subjects.length, subjectsError]);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.lightBg }]}
      edges={['left', 'right', 'bottom']}
    >
      {/* Contenido */}
      {isLoadingSubjects ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.label }]}>
            Cargando materias...
          </Text>
        </View>
      ) : subjects.length === 0 ? (
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={48} color="#DC2626" />
          <Text style={[styles.errorTitle, { color: colors.text }]}>
            No hay materias disponibles
          </Text>
          <Text style={[styles.errorMessage, { color: colors.label }]}>
            Primero debes añadir materias a tu perfil para crear un grupo.
          </Text>
          <TouchableOpacity
            style={styles.errorButton}
            onPress={() => router.push('/(tabs)/profile')}
            activeOpacity={0.6}
          >
            <Text style={styles.errorButtonText}>Ir a Perfil</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <CreateGroupForm
          subjects={subjects}
          isLoadingSubjects={isLoadingSubjects}
          isLoading={isLoading}
          onSubmit={handleSubmitGroup}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.lightBg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  errorButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  errorButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
});
