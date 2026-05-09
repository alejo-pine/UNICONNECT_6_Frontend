import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import {
    StyleSheet,
    Text,
    View,
} from 'react-native';

interface ProfileInfoItemProps {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  value: string;
}

const colors = {
  background: '#F8F9FA',
  surface: '#FFFFFF',
  text: '#1E293B',
  label: '#64748B',
  border: '#E2E8F0',
  primary: '#00284D',
  gold: '#C5A059',
};

export const ProfileInfoItem: React.FC<ProfileInfoItemProps> = ({
  icon,
  label,
  value,
}) => {
  return (
    <View style={styles.container}>
      <View style={[styles.iconContainer, { backgroundColor: colors.gold + '15' }]}>
        <MaterialIcons name={icon} size={24} color={colors.gold} />
      </View>
      <View style={styles.textContainer}>
        <Text style={[styles.label, { color: colors.label }]}>
          {label.toUpperCase()}
        </Text>
        <Text style={[styles.value, { color: colors.text }]}>
          {value}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
    fontWeight: '500',
  },
});
