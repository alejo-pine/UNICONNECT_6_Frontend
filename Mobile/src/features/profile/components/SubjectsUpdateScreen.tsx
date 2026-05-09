import { Stack } from 'expo-router';
import React, { useCallback, useMemo } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LIGHT_THEME } from '../../../theme/themeContext';
import { useSubjectsUpdateController } from '../hooks/useSubjectsUpdateController';
import {
    SubjectsUpdateHeader,
    SubjectsUpdateLoadErrorState,
    SubjectsUpdateOnboardingHero,
    SubjectsUpdateSaveFooter,
} from './SubjectsUpdateScreenParts';
import {
    AvailableSubjectsSection,
    CurrentSubjectsSection,
    ErrorBanner,
    OnboardingSubjectsContent,
} from './SubjectsUpdateSections';
import { createSubjectsUpdateStyles } from './subjectsUpdateStyles';

interface SubjectsUpdateScreenProps {
  isOnboarding?: boolean;
}

export const SubjectsUpdateScreen = ({ isOnboarding = false }: SubjectsUpdateScreenProps) => {
  const insets = useSafeAreaInsets();
  const colors = LIGHT_THEME;
  const styles = useMemo(() => createSubjectsUpdateStyles(colors), [colors]);

  const {
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
    isLoading,
    loadError,
    errorProfile,
    errorAvailable,
  } = useSubjectsUpdateController(isOnboarding);

  const screenTitle = isOnboarding ? 'SELECCIONA TUS MATERIAS' : 'Actualizar Materias';
  const handleClearInlineError = useCallback(() => setAddingError(null), [setAddingError]);

  if (loadError && !isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <SubjectsUpdateHeader
          isOnboarding={isOnboarding}
          title={screenTitle}
          onGoBack={handleGoBack}
          colors={colors}
          styles={styles}
        />
        <SubjectsUpdateLoadErrorState
          loadError={loadError}
          errorProfile={errorProfile}
          errorAvailable={errorAvailable}
          onRetry={handleRetry}
          colors={colors}
          styles={styles}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <Stack.Screen
        options={{
          title: 'Actualizar Materias',
          headerShown: false,
        }}
      />

      <SubjectsUpdateHeader
        isOnboarding={isOnboarding}
        title={screenTitle}
        onGoBack={handleGoBack}
        colors={colors}
        styles={styles}
      />

        {isOnboarding ? <SubjectsUpdateOnboardingHero styles={styles} /> : null}

        {isLoading ? (
          <View style={[styles.container, styles.center]}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Cargando materias...</Text>
          </View>
        ) : (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={[styles.scrollContent, { paddingBottom: 100 + insets.bottom }]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            nestedScrollEnabled
            scrollEventThrottle={16}
          >
          {!loadError && errorAvailable ? (
            <ErrorBanner
              message={`No se pudieron cargar las materias disponibles: ${errorAvailable}`}
              onClose={handleRetry}
              colors={colors}
              styles={styles}
            />
          ) : null}

          {isOnboarding ? (
            <OnboardingSubjectsContent
              colors={colors}
              styles={styles}
              currentSubjects={currentSubjects}
              filteredSubjects={filteredSubjects}
              searchQuery={searchQuery}
              emptySuggestionMessage={emptySuggestionMessage}
              onSearchQueryChange={setSearchQuery}
              addingSubjectIds={addingSubjectIds}
              removingSubjectIds={removingSubjectIds}
              onAddSubject={handleAddSubject}
              onRemoveSubject={handleRemoveSubject}
              inlineErrorMessage={addingError}
              onClearInlineError={handleClearInlineError}
            />
          ) : (
            <>
              <CurrentSubjectsSection
                colors={colors}
                styles={styles}
                currentSubjects={currentSubjects}
                removingSubjectIds={removingSubjectIds}
                onRemoveSubject={handleRemoveSubject}
                isOnboarding={false}
              />

              <View style={styles.divider} />

              <AvailableSubjectsSection
                colors={colors}
                styles={styles}
                filteredSubjects={filteredSubjects}
                searchQuery={searchQuery}
                onSearchQueryChange={setSearchQuery}
                addingSubjectIds={addingSubjectIds}
                onAddSubject={handleAddSubject}
                emptySuggestionMessage={emptySuggestionMessage}
                inlineErrorMessage={addingError}
                onClearInlineError={handleClearInlineError}
                isOnboarding={false}
              />
            </>
          )}

          {savingError && <ErrorBanner message={savingError} onClose={clearError} colors={colors} styles={styles} />}
          </ScrollView>
        )}

        <SubjectsUpdateSaveFooter
          isOnboarding={isOnboarding}
          insetsBottom={insets.bottom}
          saving={saving}
          onSave={handleSave}
          colors={colors}
          styles={styles}
        />
    </SafeAreaView>
  );
};
