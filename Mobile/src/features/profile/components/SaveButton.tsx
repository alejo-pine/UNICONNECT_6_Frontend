import { MaterialIcons } from '@expo/vector-icons';
import React, { memo } from 'react';
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TouchableOpacity,
} from 'react-native';

interface SaveButtonProps {
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
}

const colors = {
  primary: '#00284D',
  gold: '#C5A059',
  white: '#FFFFFF',
};

// Memoizar para evitar re-renders innecesarios
export const SaveButton = memo<SaveButtonProps>(
  ({ onPress, loading = false, disabled = false }) => {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled || loading}
        style={[
          styles.button,
          {
            backgroundColor: colors.primary,
            opacity: disabled || loading ? 0.6 : 1,
          },
        ]}
        activeOpacity={0.9}
      >
        {loading ? (
          <ActivityIndicator color={colors.gold} size="small" />
        ) : (
          <>
            <MaterialIcons name="check-circle" size={20} color={colors.white} />
            <Text style={[styles.text, { color: colors.white, marginLeft: 8 }]}>
              GUARDAR PERFIL
            </Text>
          </>
        )}
      </TouchableOpacity>
    );
  }
);

const styles = StyleSheet.create({
  button: {
    paddingVertical: 14,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    minHeight: 52,
  },
  text: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
  },
});

SaveButton.displayName = 'SaveButton';