import { MaterialIcons } from '@expo/vector-icons';
import React, { memo, useCallback, useMemo, useState } from 'react';
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SEMESTERS } from '../types/profile';

interface AcademicInfoSectionProps {
  career: string;
  semester: number | string | null;
  onSemesterChange: (value: number) => void;
}

const colors = {
  surface: '#FFFFFF',
  text: '#1F2A3C',
  label: '#6B798F',
  border: '#D5DDE8',
  gold: '#C5A059',
};

export const AcademicInfoSection = memo<AcademicInfoSectionProps>(
  ({ career, semester, onSemesterChange }) => {
    const [isSemesterDropdownOpen, setSemesterDropdownOpen] = useState(false);

    const semesterString = useMemo(() => {
      if (semester === null || semester === undefined) {
        return '';
      }

      const parsed =
        typeof semester === 'number'
          ? semester
          : Number.parseInt(String(semester), 10);

      if (!Number.isInteger(parsed) || parsed < 1 || parsed > 10) {
        return '';
      }

      return String(parsed);
    }, [semester]);

    const careerString = career || '';
    const selectedSemesterLabel = semesterString ? `${semesterString}` : 'Selecciona semestre';

    // Memoizar handlers para evitar recreación innecesaria
    const handleSemesterChange = useCallback((value: string | number) => {
      const semesterNumber = value ? Number.parseInt(String(value), 10) : 0;
      onSemesterChange(semesterNumber);
      setSemesterDropdownOpen(false);
    }, [onSemesterChange]);

    return (
      <View style={styles.container}>
        <Text style={[styles.title, { color: colors.gold }]}>
          Información Académica
        </Text>

        {/* Carrera */}
        <View style={styles.fieldContainer}>
          <Text style={[styles.label, { color: colors.label }]}>Carrera</Text>
          <View
            style={[
              styles.readOnlyContainer,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <Text style={[styles.readOnlyValue, { color: colors.text }]}>
              {careerString || 'No especificada'}
            </Text>
          </View>
          <Text style={styles.readOnlyHint}>La carrera no se puede modificar.</Text>
        </View>

        {/* Semestre */}
        <View style={styles.fieldContainer}>
          <Text style={[styles.label, { color: colors.label }]}>
            Semestre Actual
          </Text>
          <Pressable
            onPress={() => setSemesterDropdownOpen((prev) => !prev)}
            style={[
              styles.selectContainer,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <Text
              style={[
                styles.selectText,
                { color: semesterString ? colors.text : colors.label },
              ]}
            >
              {selectedSemesterLabel}
            </Text>
            <MaterialIcons name="keyboard-arrow-down" size={22} color={colors.gold} />
          </Pressable>

          {isSemesterDropdownOpen ? (
            <View style={styles.listContainer}>
              <ScrollView
                keyboardShouldPersistTaps="handled"
                nestedScrollEnabled
                showsVerticalScrollIndicator
              >
                {SEMESTERS.map((s) => (
                  <TouchableOpacity
                    key={s.value}
                    style={styles.listItem}
                    onPress={() => handleSemesterChange(s.value)}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.listItemText}>{s.label}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          ) : null}
        </View>
      </View>
    );
  }
);

AcademicInfoSection.displayName = 'AcademicInfoSection';

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
    fontFamily: 'Playfair Display',
  },
  fieldContainer: {
    marginBottom: 16,
    position: 'relative',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    marginLeft: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  selectContainer: {
    borderWidth: 1,
    borderRadius: 14,
    minHeight: 56,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectText: {
    flex: 1,
    color: '#1F2A3C',
    fontSize: 18,
  },
  readOnlyContainer: {
    borderWidth: 1,
    borderRadius: 14,
    minHeight: 56,
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  readOnlyValue: {
    fontSize: 15,
    fontWeight: '600',
  },
  readOnlyHint: {
    marginTop: 6,
    marginLeft: 8,
    fontSize: 12,
    color: '#6B798F',
    fontStyle: 'italic',
  },
  listContainer: {
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D5DDE8',
    backgroundColor: '#FFFFFF',
    maxHeight: 220,
    overflow: 'hidden',
  },
  listItem: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EFF2F7',
  },
  listItemText: {
    color: '#293447',
    fontSize: 16,
  },
});
