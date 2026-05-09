import { MaterialIcons } from '@expo/vector-icons';
import React, { memo } from 'react';
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { LIGHT_THEME } from '../../../theme/themeContext';

interface SubjectsSectionProps {
  subjects: string[];
  onAddSubject?: () => void;
  onRemoveSubject?: (index: number) => void;
  canRemove?: boolean;
}

const THEME = LIGHT_THEME;
const UI = {
  subjectBackground: '#F1F5F9',
  subjectBorder: '#E2E8F0',
  subjectText: '#334155',
  removeIcon: '#CBD5E1',
  emptyText: '#94A3B8',
} as const;

export const SubjectsSection = memo<SubjectsSectionProps>(
  ({ subjects, onAddSubject, onRemoveSubject, canRemove = false }) => {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: THEME.gold }]}>
            Materias Actuales
          </Text>
          <TouchableOpacity onPress={onAddSubject} style={styles.addButton} disabled={!onAddSubject}>
            <MaterialIcons name="add-circle-outline" size={22} color={THEME.gold} />
            <Text style={[styles.addButtonText, { color: THEME.gold }]}>
              Añadir materia
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.subjectsList}>
          {subjects.length === 0 ? (
            <Text style={styles.emptyText}>No hay materias registradas</Text>
          ) : (
            subjects.map((subject, index) => (
              <View key={`${subject}-${index}`} style={styles.subjectTag}>
                <Text style={styles.subjectText}>{subject}</Text>
                {canRemove && (
                  <TouchableOpacity
                    onPress={() => onRemoveSubject?.(index)}
                    style={styles.closeButton}
                  >
                    <MaterialIcons name="cancel" size={18} color={UI.removeIcon} />
                  </TouchableOpacity>
                )}
              </View>
            ))
          )}
        </View>
      </View>
    );
  }
);

SubjectsSection.displayName = 'SubjectsSection';

const styles = StyleSheet.create({
  container: {
    marginTop: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  addButtonText: {
    fontSize: 13,
    fontWeight: '700',
  },
  subjectsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  subjectTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: UI.subjectBackground,
    borderWidth: 1,
    borderColor: UI.subjectBorder,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  subjectText: {
    fontSize: 13,
    color: UI.subjectText,
    fontWeight: '500',
  },
  closeButton: {
    marginLeft: 8,
  },
  emptyText: {
    color: UI.emptyText,
    fontStyle: 'italic',
    fontSize: 13,
  }
});