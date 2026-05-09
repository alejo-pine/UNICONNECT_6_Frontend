import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, Platform, Text, TouchableOpacity, View } from 'react-native';
import { type ThemeColors } from '../../../theme/themeContext';
import { type SubjectsUpdateStyles } from './subjectsUpdateStyles';

interface SubjectsUpdateHeaderProps {
  isOnboarding: boolean;
  title: string;
  onGoBack: () => void;
  colors: ThemeColors;
  styles: SubjectsUpdateStyles;
}

export const SubjectsUpdateHeader = ({ isOnboarding, title, onGoBack, colors, styles }: SubjectsUpdateHeaderProps) => (
  <View style={[styles.header, isOnboarding ? styles.headerOnboarding : null, { backgroundColor: colors.primary }]}>
    <View style={[styles.headerLeft, isOnboarding ? styles.headerLeftOnboarding : null]}>
      <TouchableOpacity onPress={onGoBack} style={styles.backButton}>
        <MaterialIcons name="arrow-back" size={24} color={colors.surface} />
      </TouchableOpacity>
      <Text style={[styles.headerTitle, isOnboarding ? styles.headerTitleOnboarding : null]}>{title}</Text>
    </View>
  </View>
);

interface SubjectsUpdateOnboardingHeroProps {
  styles: SubjectsUpdateStyles;
}

export const SubjectsUpdateOnboardingHero = ({ styles }: SubjectsUpdateOnboardingHeroProps) => (
  <View style={styles.onboardingHeroContainer}>
    <Text style={styles.onboardingStepLabel}>PASO 2 DE 2</Text>
    <View style={styles.onboardingDotsRow}>
      <View style={[styles.onboardingDot, styles.onboardingDotInactive]} />
      <View style={styles.onboardingDotPill}>
        <View style={[styles.onboardingDot, styles.onboardingDotActive]} />
      </View>
    </View>
    <Text style={styles.onboardingDescription}>
      Agrega tus cursos actuales para que tus companeros puedan encontrarte y colaborar contigo.
    </Text>
  </View>
);

interface SubjectsUpdateLoadErrorStateProps {
  loadError: string;
  errorProfile?: string | null;
  errorAvailable?: string | null;
  onRetry: () => void;
  colors: ThemeColors;
  styles: SubjectsUpdateStyles;
}

export const SubjectsUpdateLoadErrorState = ({
  loadError,
  errorProfile,
  errorAvailable,
  onRetry,
  colors,
  styles,
}: SubjectsUpdateLoadErrorStateProps) => (
  <View style={[styles.container, styles.center, { padding: 24 }]}>
    <MaterialIcons name="error-outline" size={48} color={colors.primary} />
    <Text style={[styles.errorMessage, { marginTop: 16, marginBottom: 8 }]}>{loadError || 'Error desconocido'}</Text>
    {errorProfile ? <Text style={[styles.errorDetails, { marginBottom: 16 }]}>Error de perfil: {errorProfile}</Text> : null}
    {errorAvailable ? <Text style={[styles.errorDetails, { marginBottom: 16 }]}>Error de materias: {errorAvailable}</Text> : null}
    <TouchableOpacity style={[styles.retryButton, { backgroundColor: colors.primary }]} onPress={onRetry}>
      <Text style={styles.retryButtonText}>Reintentar</Text>
    </TouchableOpacity>
  </View>
);

interface SubjectsUpdateSaveFooterProps {
  isOnboarding: boolean;
  insetsBottom: number;
  saving: boolean;
  onSave: () => void;
  colors: ThemeColors;
  styles: SubjectsUpdateStyles;
}

export const SubjectsUpdateSaveFooter = ({
  isOnboarding,
  insetsBottom,
  saving,
  onSave,
  colors,
  styles,
}: SubjectsUpdateSaveFooterProps) => {
  const isIosOnboarding = isOnboarding && Platform.OS === 'ios';

  return (
    <View
      style={[
        styles.buttonContainer,
        isOnboarding ? styles.buttonContainerOnboarding : null,
        isIosOnboarding ? { bottom: 0, paddingTop: 8 } : null,
        { paddingBottom: isOnboarding ? Math.max(0, insetsBottom) : Math.max(16, insetsBottom) },
      ]}
    >
      <TouchableOpacity
        style={[
          styles.saveButton,
          isOnboarding ? styles.saveButtonOnboarding : null,
          isIosOnboarding ? { marginTop: 8, marginBottom: 0 } : null,
          { backgroundColor: colors.primary },
        ]}
        onPress={onSave}
        disabled={saving}
        activeOpacity={0.85}
      >
        {saving ? (
          <ActivityIndicator color={colors.surface} />
        ) : (
          <>
            {!isOnboarding ? <MaterialIcons name="check-circle" size={20} color={colors.surface} /> : null}
            <Text style={[styles.saveButtonText, isOnboarding ? styles.saveButtonTextOnboarding : null, { color: colors.surface }]}>
              {isOnboarding ? 'FINALIZAR REGISTRO' : 'GUARDAR CAMBIOS'}
            </Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
};
