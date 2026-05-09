import React from 'react';
import {
  StyleSheet,
  Text,
  View,
} from 'react-native';

interface SectionHeaderProps {
  title: string;
}

const colors = {
  label: '#64748B',
  border: '#E2E8F0',
  gold: '#C5A059',
};

export const SectionHeader: React.FC<SectionHeaderProps> = ({ title }) => {
  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: colors.gold }]}>
        {title}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    fontFamily: 'Lora',
  },
});
