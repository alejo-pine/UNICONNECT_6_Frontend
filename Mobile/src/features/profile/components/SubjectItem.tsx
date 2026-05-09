/**
 * Componente para item de materia disponible
 * Memoizado para evitar re-renders innecesarios
 */
import { MaterialIcons } from '@expo/vector-icons';
import React, { memo, useCallback } from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LIGHT_THEME } from '../../../theme/themeContext';

const THEME = LIGHT_THEME;
const UI = {
  cardBackground: '#F8F9FA',
  cardBorder: '#E8E8E8',
  onboardingCardBackground: '#F4F6F9',
  onboardingCardBorder: '#E5EAF1',
  actionBackground: '#F2F2F2',
  actionBorder: '#ECECEC',
  onboardingTitle: '#222F44',
} as const;

interface SubjectItemProps {
  subjectId: string;
  name: string;
  department: string;
  onAdd: (subjectId: string) => void;
  isLoading?: boolean;
  variant?: 'default' | 'onboarding';
}

export const SubjectItem = memo<SubjectItemProps>(({ subjectId, name, department, onAdd, isLoading = false, variant = 'default' }) => {
  const handlePress = useCallback(() => {
    if (!isLoading) {
      onAdd(subjectId);
    }
  }, [onAdd, subjectId, isLoading]);

  const isOnboarding = variant === 'onboarding';

  return (
    <View style={[styles.container, isOnboarding && styles.containerOnboarding]}>
      <View style={styles.content}>
        <Text style={[styles.name, isOnboarding && styles.nameOnboarding]}>{name}</Text>
        {!isOnboarding ? <Text style={styles.department}>{department}</Text> : null}
      </View>
      <TouchableOpacity 
        style={[styles.addButton, isOnboarding && styles.addButtonOnboarding, isLoading && styles.addButtonLoading]} 
        onPress={handlePress}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color={THEME.gold} />
        ) : (
          <MaterialIcons name="add" size={20} color={THEME.gold} />
        )}
      </TouchableOpacity>
    </View>
  );
});

SubjectItem.displayName = 'SubjectItem';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    marginBottom: 8,
    backgroundColor: UI.cardBackground,
    borderWidth: 1,
    borderColor: UI.cardBorder,
    borderRadius: 12,
  },
  containerOnboarding: {
    backgroundColor: UI.onboardingCardBackground,
    borderColor: UI.onboardingCardBorder,
    borderRadius: 14,
    marginBottom: 14,
    paddingVertical: 18,
    paddingHorizontal: 16,
  },
  content: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
    color: THEME.text,
    marginBottom: 4,
  },
  nameOnboarding: {
    fontSize: Platform.OS === 'ios' ? 17 : 18,
    lineHeight: Platform.OS === 'ios' ? 22 : 24,
    color: UI.onboardingTitle,
    fontWeight: '600',
    marginBottom: 0,
  },
  department: {
    fontSize: 11,
    color: THEME.label,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: UI.actionBackground,
    borderWidth: 1,
    borderColor: UI.actionBorder,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  addButtonOnboarding: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: UI.actionBackground,
    borderWidth: 1,
    borderColor: UI.actionBorder,
  },
  addButtonLoading: {
    opacity: 0.7,
  },
});
