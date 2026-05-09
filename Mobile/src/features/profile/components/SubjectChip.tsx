/**
 * Componente chip para mostrar materia con botón de remover
 * Memoizado para evitar re-renders innecesarios
 */
import { MaterialIcons } from '@expo/vector-icons';
import React, { memo, useCallback } from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface SubjectChipProps {
  id: string;
  name: string;
  onRemove: (id: string) => void;
  isLoading?: boolean;
  variant?: 'default' | 'onboarding';
}

export const SubjectChip = memo<SubjectChipProps>(({ id, name, onRemove, isLoading = false, variant = 'default' }) => {
  const handleRemove = useCallback(() => {
    if (!isLoading) {
      onRemove(id);
    }
  }, [onRemove, id, isLoading]);

  const isOnboarding = variant === 'onboarding';

  return (
    <View style={[styles.chip, isOnboarding && styles.chipOnboarding]}>
      <Text style={[styles.text, isOnboarding && styles.textOnboarding]}>{name}</Text>
      <TouchableOpacity 
        onPress={handleRemove} 
        style={[styles.removeButton, isLoading && styles.removeButtonLoading]}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color={isOnboarding ? '#FFFFFF' : '#00284D'} />
        ) : (
          <MaterialIcons name="close" size={18} color={isOnboarding ? '#FFFFFF' : '#00284D'} />
        )}
      </TouchableOpacity>
    </View>
  );
});

SubjectChip.displayName = 'SubjectChip';

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#00284D',
    borderRadius: 999,
  },
  chipOnboarding: {
    backgroundColor: '#00284D',
    borderColor: '#00284D',
    paddingHorizontal: 18,
    paddingVertical: 10,
    gap: 6,
  },
  text: {
    fontSize: 14,
    fontWeight: '500',
    color: '#00284D',
  },
  textOnboarding: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: Platform.OS === 'ios' ? 14 : 15,
  },
  removeButton: {
    padding: 2,
  },
  removeButtonLoading: {
    opacity: 0.6,
  },
});
