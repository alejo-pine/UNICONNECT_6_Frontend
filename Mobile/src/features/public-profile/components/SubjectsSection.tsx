/**
 * Componente que muestra la sección de materias inscritas
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { PublicProfileSubject } from '../types/publicProfile';

interface SubjectsSectionProps {
  subjects?: PublicProfileSubject[];
}

export const SubjectsSection: React.FC<SubjectsSectionProps> = ({ subjects }) => {
  // Protección contra undefined/null
  if (!subjects || !Array.isArray(subjects) || subjects.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>MATERIAS INSCRITAS</Text>
      
      <View style={styles.subjectsContainer}>
        {subjects.map((subject) => (
          <View key={subject.id} style={styles.subjectChip}>
            <Text style={styles.subjectText}>{subject.name}</Text>
          </View>
        ))}
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
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#B8860B', // Dorado
    letterSpacing: 0.5,
    marginBottom: 16,
  },
  subjectsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  subjectChip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#002147', // Azul oscuro
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  subjectText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#4B5563', // Gris neutral
  },
});
