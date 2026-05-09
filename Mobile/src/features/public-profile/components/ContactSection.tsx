/**
 * Componente que muestra la información de contacto del estudiante
 * Con funcionalidad de copiar al portapapeles usando expo-clipboard
 */
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import React from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface ContactSectionProps {
  phoneNumber: string | null;
}

export const ContactSection: React.FC<ContactSectionProps> = ({ phoneNumber }) => {
  const handleCopyPhoneNumber = async () => {
    if (!phoneNumber) return;

    try {
      await Clipboard.setStringAsync(phoneNumber);
      Alert.alert('¡Copiado!', 'Número de teléfono copiado al portapapeles');
    } catch (error) {
      console.error('[ContactSection] Error al copiar:', error);
      Alert.alert('Error', 'No se pudo copiar el número');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.header}>
          <Ionicons name="call-outline" size={24} color="#002147" />
          <Text style={styles.title}>Contacto</Text>
        </View>

        {phoneNumber ? (
          <View style={styles.phoneContainer}>
            <View style={styles.phoneInfo}>
              <Text style={styles.phoneLabel}>TELÉFONO MÓVIL</Text>
              <Text style={styles.phoneNumber}>{phoneNumber}</Text>
            </View>
            <TouchableOpacity
              style={styles.copyButton}
              onPress={handleCopyPhoneNumber}
              activeOpacity={0.7}
            >
              <Ionicons name="copy-outline" size={20} color="#B8860B" />
              <Text style={styles.copyButtonText}>Copiar</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.noContactContainer}>
            <Text style={styles.noContactText}>
              El estudiante no ha registrado información de contacto
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#F5F5F5',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#002147', // Azul oscuro
  },
  phoneContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
  },
  phoneInfo: {
    flex: 1,
  },
  phoneLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6B7280',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  phoneNumber: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(184, 134, 11, 0.05)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginLeft: 12,
  },
  copyButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#B8860B', // Dorado
  },
  noContactContainer: {
    backgroundColor: '#E5E7EB',
    borderRadius: 8,
    padding: 16,
  },
  noContactText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
});
