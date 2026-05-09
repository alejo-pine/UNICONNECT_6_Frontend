import { MaterialIcons } from '@expo/vector-icons';
import React, { memo, useCallback } from 'react';
import {
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';

interface ContactInfoSectionProps {
  phone: string;
  onPhoneChange: (value: string) => void;
  phoneError?: string | null;
}

const colors = {
  surface: '#FFFFFF',
  text: '#1E293B',
  label: '#64748B',
  border: '#E2E8F0',
  gold: '#C5A059',
};

export const ContactInfoSection = memo<ContactInfoSectionProps>(
  ({ phone, onPhoneChange, phoneError }) => {
    // Memoizar el handler de cambio de teléfono
    const handlePhoneChange = useCallback((text: string) => {
      const onlyNumbers = text.replace(/\D/g, '');
      const limitedNumbers = onlyNumbers.slice(0, 10);
      onPhoneChange(limitedNumbers);
    }, [onPhoneChange]);
    return (
      <View style={styles.container}>
        <Text style={[styles.title, { color: colors.gold }]}>
          Información de Contacto
        </Text>

        <View style={styles.fieldContainer}>
          <Text style={[styles.label, { color: colors.label }]}>
            Número de Teléfono
          </Text>
          <View style={styles.inputWrapper}>
            <MaterialIcons
              name="phone"
              size={20}
              color={colors.gold}
              style={styles.icon}
            />
            <TextInput
              placeholder="302 000 0000"
              placeholderTextColor="#94A3B8"
              value={phone}
              onChangeText={handlePhoneChange}
              keyboardType="phone-pad"
              maxLength={10}
              style={styles.input}
            />
          </View>
          {phoneError ? <Text style={styles.fieldError}>{phoneError}</Text> : null}
        </View>
      </View>
    );
  }
);

ContactInfoSection.displayName = 'ContactInfoSection';

const styles = StyleSheet.create({
  container: {
    marginTop: 10,
    width: '100%',
    minHeight: 100, // Asegura que ocupe espacio
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  fieldContainer: {
    marginBottom: 8,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 8,
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    height: 50, // Altura fija para evitar colapsos
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 15,
    color: '#1E293B',
  },
  fieldError: {
    marginTop: 6,
    marginLeft: 4,
    color: '#B42318',
    fontSize: 12,
    fontWeight: '500',
  },
});
