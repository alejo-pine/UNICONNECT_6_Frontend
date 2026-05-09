import React, { memo } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';

interface Subject {
  id: string;
  name: string;
}

interface SubjectsDisplayProps {
  subjects: Subject[];
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

export const SubjectsDisplay = memo<SubjectsDisplayProps>(({ subjects }) => {
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.subjectsScroll}
      >
        {subjects.length === 0 ? (
          <Text style={[styles.emptyText, { color: colors.label }]}>
            No hay materias registradas
          </Text>
        ) : (
          subjects.map((subject) => (
            <View
              key={subject.id}
              style={[
                styles.subjectTag,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.primary,
                },
              ]}
            >
              <Text style={[styles.subjectText, { color: colors.text }]}>
                {subject.name}
              </Text>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
});

SubjectsDisplay.displayName = 'SubjectsDisplay';

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
  },
  subjectsScroll: {
    flexGrow: 0,
  },
  subjectTag: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderRadius: 8,
    marginRight: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
  },
  subjectText: {
    fontSize: 13,
    fontWeight: '500',
  },
  emptyText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
});
