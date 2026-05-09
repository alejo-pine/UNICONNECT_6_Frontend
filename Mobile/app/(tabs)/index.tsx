import { colors } from '@/src/theme/colors';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  StyleSheet,
  Text,
  View,
} from 'react-native';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Ionicons name="ribbon-outline" size={80} color={colors.gold} />
      <Text style={styles.title}>¡Bienvenido a Uniconnect!</Text>
      <Text style={styles.subtitle}>
        Este espacio está siendo preparado para ti. Próximamente encontrarás aquí un resumen de tu actividad, notificaciones importantes y más funcionalidades increíbles.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundLight,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: colors.primary,
    marginTop: 24,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 24,
  }
});
