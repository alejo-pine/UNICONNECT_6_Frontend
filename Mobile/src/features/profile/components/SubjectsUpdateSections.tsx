import { MaterialIcons } from '@expo/vector-icons';
import React, { memo, useCallback, useMemo } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import { type Subject } from '../../../services/profileHttpService';
import { type ThemeColors } from '../../../theme/themeContext';
import { SubjectChip } from './SubjectChip';
import { SubjectItem } from './SubjectItem';
import { type SubjectsUpdateStyles } from './subjectsUpdateStyles';

interface CurrentSubjectsSectionProps {
  colors: ThemeColors;
  styles: SubjectsUpdateStyles;
  currentSubjects: Subject[];
  removingSubjectIds: Set<string>;
  onRemoveSubject: (subjectId: string) => void;
  isOnboarding?: boolean;
}

export const CurrentSubjectsSection = memo<CurrentSubjectsSectionProps>(
  ({ colors, styles, currentSubjects, removingSubjectIds, onRemoveSubject, isOnboarding = false }) => {
    return (
      <View style={[styles.section, !isOnboarding && styles.currentSectionSpacing]}>
        {!isOnboarding ? (
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.gold }]}>Mis Materias Actuales</Text>
            <Text style={styles.sectionSubtitle}>Elimina las materias que ya no estes cursando</Text>
          </View>
        ) : null}

        {currentSubjects.length === 0 ? (
          <Text style={styles.emptyText}>Aun no has agregado materias.</Text>
        ) : (
          <View style={styles.chipContainer}>
            {currentSubjects.map((subject) => (
              <SubjectChip
                key={subject.id}
                id={subject.id}
                name={subject.name}
                onRemove={onRemoveSubject}
                isLoading={removingSubjectIds.has(subject.id)}
                variant={isOnboarding ? 'onboarding' : 'default'}
              />
            ))}
          </View>
        )}
      </View>
    );
  }
);

CurrentSubjectsSection.displayName = 'CurrentSubjectsSection';

interface OnboardingSubjectsContentProps {
  colors: ThemeColors;
  styles: SubjectsUpdateStyles;
  currentSubjects: Subject[];
  filteredSubjects: Subject[];
  searchQuery: string;
  emptySuggestionMessage: string;
  onSearchQueryChange: (query: string) => void;
  addingSubjectIds: Set<string>;
  removingSubjectIds: Set<string>;
  onAddSubject: (subject: Subject) => void;
  onRemoveSubject: (subjectId: string) => void;
  inlineErrorMessage?: string | null;
  onClearInlineError?: () => void;
}

export const OnboardingSubjectsContent = memo<OnboardingSubjectsContentProps>(
  ({
    colors,
    styles,
    currentSubjects,
    filteredSubjects,
    searchQuery,
    emptySuggestionMessage,
    onSearchQueryChange,
    addingSubjectIds,
    removingSubjectIds,
    onAddSubject,
    onRemoveSubject,
    inlineErrorMessage,
    onClearInlineError,
  }) => {
    const subjectsById = useMemo(
      () => new Map(filteredSubjects.map((subject) => [subject.id, subject])),
      [filteredSubjects]
    );

    const handleAddSubjectById = useCallback(
      (subjectId: string) => {
        const subject = subjectsById.get(subjectId);
        if (subject) {
          onAddSubject(subject);
        }
      },
      [onAddSubject, subjectsById]
    );

    return (
      <View style={styles.section}>
        <View style={[styles.searchBarContainer, styles.searchBarContainerOnboarding]}>
          <MaterialIcons name="search" size={20} color={colors.gold} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, styles.searchInputOnboarding, { color: colors.text }]}
            placeholder="Buscar materias (ej. Fisica, Biologia)..."
            placeholderTextColor={colors.label}
            value={searchQuery}
            onChangeText={onSearchQueryChange}
          />
        </View>

        {inlineErrorMessage ? (
          <ErrorBanner
            message={inlineErrorMessage}
            onClose={onClearInlineError || (() => undefined)}
            colors={colors}
            styles={styles}
          />
        ) : null}

        {currentSubjects.length === 0 ? (
          <Text style={styles.emptyText}>Aun no has agregado materias.</Text>
        ) : (
          <View style={[styles.chipContainer, styles.onboardingChipContainer]}>
            {currentSubjects.map((subject) => (
              <SubjectChip
                key={subject.id}
                id={subject.id}
                name={subject.name}
                onRemove={onRemoveSubject}
                isLoading={removingSubjectIds.has(subject.id)}
                variant="onboarding"
              />
            ))}
          </View>
        )}

        <Text style={[styles.sectionTitle, styles.onboardingSectionTitle]}>SUGERENCIAS PARA TU CARRERA</Text>

        <View style={styles.subjectsList}>
          {filteredSubjects.length === 0 ? (
            <Text style={styles.noResultsText}>
              {searchQuery ? 'No se encontraron materias' : emptySuggestionMessage}
            </Text>
          ) : (
            <View>
              {filteredSubjects.map((item) => (
                <SubjectItem
                  key={item.id}
                  subjectId={item.id}
                  name={item.name}
                  department={item.program || item.department || ''}
                  onAdd={handleAddSubjectById}
                  isLoading={addingSubjectIds.has(item.id)}
                  variant="onboarding"
                />
              ))}
            </View>
          )}
        </View>
      </View>
    );
  }
);

OnboardingSubjectsContent.displayName = 'OnboardingSubjectsContent';

interface AvailableSubjectsSectionProps {
  colors: ThemeColors;
  styles: SubjectsUpdateStyles;
  filteredSubjects: Subject[];
  searchQuery: string;
  emptySuggestionMessage?: string;
  onSearchQueryChange: (query: string) => void;
  addingSubjectIds: Set<string>;
  onAddSubject: (subject: Subject) => void;
  inlineErrorMessage?: string | null;
  onClearInlineError?: () => void;
  isOnboarding?: boolean;
}

export const AvailableSubjectsSection = memo<AvailableSubjectsSectionProps>(
  ({
    colors,
    styles,
    filteredSubjects,
    searchQuery,
    emptySuggestionMessage,
    onSearchQueryChange,
    addingSubjectIds,
    onAddSubject,
    inlineErrorMessage,
    onClearInlineError,
    isOnboarding = false,
  }) => {
    const subjectsById = useMemo(
      () => new Map(filteredSubjects.map((subject) => [subject.id, subject])),
      [filteredSubjects]
    );

    const handleAddSubjectById = useCallback(
      (subjectId: string) => {
        const subject = subjectsById.get(subjectId);
        if (subject) {
          onAddSubject(subject);
        }
      },
      [onAddSubject, subjectsById]
    );

    return (
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, isOnboarding ? styles.onboardingSectionTitle : { color: colors.gold }]}>
          {isOnboarding ? 'SUGERENCIAS PARA TU CARRERA' : 'Buscar y Anadir'}
        </Text>

        <View style={[styles.searchBarContainer, isOnboarding && styles.searchBarContainerOnboarding]}>
          <MaterialIcons
            name="search"
            size={20}
            color={colors.gold}
            style={styles.searchIcon}
          />
          <TextInput
            style={[styles.searchInput, isOnboarding && styles.searchInputOnboarding, { color: colors.text }]}
            placeholder={isOnboarding ? 'Buscar materias (ej. Fisica, Biologia)...' : 'Buscar nuevas materias...'}
            placeholderTextColor={colors.label}
            value={searchQuery}
            onChangeText={onSearchQueryChange}
          />
        </View>

        {inlineErrorMessage ? (
          <ErrorBanner
            message={inlineErrorMessage}
            onClose={onClearInlineError || (() => undefined)}
            colors={colors}
            styles={styles}
          />
        ) : null}

        <View style={styles.subjectsList}>
          {filteredSubjects.length === 0 ? (
            <Text style={styles.noResultsText}>
              {searchQuery ? 'No se encontraron materias' : (emptySuggestionMessage || 'Todas las materias estan agregadas')}
            </Text>
          ) : (
            <View>
              {filteredSubjects.map((item) => (
                <SubjectItem
                  key={item.id}
                  subjectId={item.id}
                  name={item.name}
                  department={item.program || item.department || ''}
                  onAdd={handleAddSubjectById}
                  isLoading={addingSubjectIds.has(item.id)}
                  variant={isOnboarding ? 'onboarding' : 'default'}
                />
              ))}
            </View>
          )}
        </View>
      </View>
    );
  }
);

AvailableSubjectsSection.displayName = 'AvailableSubjectsSection';

interface ErrorBannerProps {
  message: string;
  onClose: () => void;
  colors: ThemeColors;
  styles: SubjectsUpdateStyles;
}

export const ErrorBanner = memo<ErrorBannerProps>(({ message, onClose, colors, styles }) => {
  return (
    <View style={styles.errorContainer}>
      <Text style={styles.errorText}>{message}</Text>
      <TouchableOpacity onPress={onClose}>
        <MaterialIcons name="close" size={20} color={colors.error} />
      </TouchableOpacity>
    </View>
  );
});

ErrorBanner.displayName = 'ErrorBanner';
