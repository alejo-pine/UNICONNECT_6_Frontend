import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../../store/authStore';
import { LIGHT_THEME } from '../../../theme/themeContext';
import { getErrorMessage, parseError } from '../../../utils/errorHandler';
import { AcademicInfoSection } from '../components/AcademicInfoSection';
import { ContactInfoSection } from '../components/ContactInfoSection';
import { ProfileHeader } from '../components/ProfileHeader';
import { SaveButton } from '../components/SaveButton';
import { SubjectsSection } from '../components/SubjectsSection';
import { useLoadProfileSubjects } from '../hooks/useLoadProfileSubjects';
import { useProfileForm } from '../hooks/useProfileForm';
import { useProfileLoad } from '../hooks/useProfileLoad';

export const EditProfileScreen = ({ isOnboarding = false }) => {
  const theme = LIGHT_THEME;
  const router = useRouter();
  const params = useLocalSearchParams();
  const { userId, token } = useAuthStore();
  const [phoneError, setPhoneError] = useState<string | null>(null);

  // Memoizar datos iniciales para evitar recomputación
  const initialData = useMemo(() => {
    try {
      return params.initialData ? JSON.parse(params.initialData as string) : undefined;
    } catch (error) {
      console.error('Error al parsear datos iniciales:', error);
      return undefined;
    }
  }, [params.initialData]);

  const {
    profile,
    loading,
    error,
    updateSemester,
    updateAvatar,
    updatePhone,
    removeSubject,
    saveProfile,
  } = useProfileForm(initialData);

  const { loadProfile } = useProfileLoad();
  const { subjects: profileSubjects, loading: subjectsLoading, reload: reloadSubjects } = useLoadProfileSubjects(
    userId || '',
    token || ''
  );

  // Refresca el perfil y materias cuando la pantalla enfoca
  // Esto asegura que los cambios de materias desde SubjectsUpdateScreen se reflejen
  useFocusEffect(
    useCallback(() => {
      loadProfile();
      if (userId && token) {
        reloadSubjects();
      }
    }, [loadProfile, reloadSubjects, userId, token])
  );

  // Separar lógica de manejo de guardado
  const handleSave = useCallback(async () => {
    const normalizedPhone = (profile.phone_number || '').trim();
    const phoneDigits = normalizedPhone.replace(/\D/g, '').length;

    if (!normalizedPhone) {
      setPhoneError('Debes ingresar un numero de contacto.');
      return;
    }

    if (phoneDigits < 10) {
      setPhoneError('El numero debe contener al menos 10 digitos.');
      return;
    }

    setPhoneError(null);

    const success = await saveProfile();
    if (success) {
      Alert.alert('¡Éxito!', 'Información actualizada correctamente');
      if (isOnboarding) {
        router.replace('/(tabs)');
      } else {
        router.back();
      }
    } else {
      const appError = parseError({ message: error });
      const errorMessage = getErrorMessage(appError);
      Alert.alert('Error', errorMessage);
    }
  }, [saveProfile, error, isOnboarding, profile.phone_number, router]);

  const handlePhoneChange = useCallback((value: string) => {
    updatePhone(value);
    if (phoneError) {
      setPhoneError(null);
    }
  }, [phoneError, updatePhone]);

  if (loading && !profile.name) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1 }}
      keyboardVerticalOffset={0}
    >
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.background }]}
        edges={['top', 'left', 'right', 'bottom']}
      >
        <Stack.Screen
          options={{
            title: isOnboarding ? 'Completar Registro' : 'Editar Perfil',
            headerStyle: { backgroundColor: theme.primary },
            headerTintColor: '#fff',
          }}
        />

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: 112 },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
          onScrollBeginDrag={Keyboard.dismiss}
        >
            <ProfileHeader
              avatarUrl={profile.avatar_url || ''}
              onAvatarChange={updateAvatar}
            />
            
            <View style={styles.readOnlyContainer}>
              <Text style={styles.userName}>
                {profile.name || 'Usuario'}
              </Text>
              <Text style={styles.readOnlyLabel}>Datos validados por la cuenta</Text>
            </View>

            <View style={styles.section}>
              <AcademicInfoSection
                career={profile.career || ''}
                semester={profile.semester ?? null}
                onSemesterChange={updateSemester}
              />
            </View>

            <View style={styles.section}>
              <ContactInfoSection
                phone={profile.phone_number || ''}
                onPhoneChange={handlePhoneChange}
                phoneError={phoneError}
              />
            </View>

            <View style={styles.section}>
              {subjectsLoading ? (
                <ActivityIndicator size="small" color={theme.primary} />
              ) : (
                <SubjectsSection
                  subjects={profileSubjects.map((s) => s?.name || '')}
                  canRemove={false}
                  onAddSubject={() => {
                    router.push({
                      pathname: '/profile/subjects-update',
                      params: { 
                        initialSubjects: JSON.stringify(profileSubjects),
                        career: profile.career || '',
                        isEditing: 'true'
                      }
                    });
                  }}
                  onRemoveSubject={(index: number) => {
                    const subject = profileSubjects[index];
                    if (subject?.id) removeSubject(subject.id);
                  }}
                />
              )}
            </View>

          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
        </ScrollView>

        {/* Botón fijo en la parte inferior - misma altura que Perfil */}
        <View
          style={[
            styles.buttonContainer,
            {
              paddingTop: 10,
              paddingBottom: Platform.OS === 'ios' ? 10 : 12,
              backgroundColor: theme.background,
            },
          ]}
        >
          <SaveButton onPress={handleSave} loading={loading} />
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { justifyContent: 'center', alignItems: 'center' },
  scrollView: { 
    flex: 1,
  },
  scrollContent: { 
    paddingHorizontal: 16, 
    paddingTop: 12,
    paddingBottom: 12,
  },
  section: {
    marginBottom: 24,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  readOnlyContainer: {
    alignItems: 'center',
    marginBottom: 20,
    marginTop: -10,
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
  },
  readOnlyLabel: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
    fontStyle: 'italic',
  },
  buttonContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
    minHeight: 72,
    justifyContent: 'center',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  errorContainer: {
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#FEE2E2',
  },
  errorText: {
    color: '#DC2626',
    fontSize: 13,
    textAlign: 'center',
  },
});