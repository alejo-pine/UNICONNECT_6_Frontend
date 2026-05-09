import { AcademicInfoSection } from '@/src/features/profile/components/AcademicInfoSection';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const colors = {
  background: '#F8F9FA',
  surface: '#FFFFFF',
  text: '#1E293B',
  label: '#64748B',
  border: '#E2E8F0',
  primary: '#00284D',
  gold: '#C5A059',
};

export default function CompleteProfileScreen() {
  const router = useRouter();
  const theme = colors;

  const [career, setCareer] = useState('engineering');
  const [semester, setSemester] = useState(5);
  const [subjects, setSubjects] = useState([
    'Cálculo Diferencial',
    'Física Mecánica',
    'Programación II',
  ]);

  const handleRemoveSubject = (index: number) => {
    setSubjects(subjects.filter((_, i) => i !== index));
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.primary }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialIcons name="chevron-left" size={32} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Editar Perfil</Text>
        <View style={styles.logoPlaceholder}>
          <MaterialIcons name="school" size={24} color={theme.gold} />
        </View>
      </View>

      {/* Main Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Picture Section */}
        <View style={styles.profileImageContainer}>
          <View
            style={[
              styles.profileImage,
              { borderColor: theme.surface, backgroundColor: theme.surface },
            ]}
          >
            <MaterialIcons name="person" size={80} color={theme.label} />
          </View>
          <TouchableOpacity
            style={[
              styles.cameraButton,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <MaterialIcons name="camera-alt" size={20} color={theme.gold} />
          </TouchableOpacity>
        </View>

        {/* Academic Info Section */}
        <View
          style={[
            styles.section,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <AcademicInfoSection
            career={career}
            semester={semester}
            onCareerChange={setCareer}
            onSemesterChange={setSemester}
          />
        </View>

        {/* Subjects Section */}
        <View style={styles.subjectsSection}>
          <View style={styles.subjectHeader}>
            <Text style={[styles.sectionTitle, { color: theme.gold }]}>
              Materias Actuales
            </Text>
            <TouchableOpacity style={styles.addButton}>
              <MaterialIcons name="add-circle-outline" size={20} color={theme.gold} />
              <Text style={[styles.addButtonText, { color: theme.gold }]}>
                Añadir Materia
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.subjectsList}>
            {subjects.map((subject, index) => (
              <View
                key={index}
                style={[
                  styles.subjectTag,
                  {
                    backgroundColor: theme.surface,
                    borderColor: `${theme.primary}33`,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.subjectText,
                    { color: theme.primary },
                  ]}
                >
                  {subject}
                </Text>
                <TouchableOpacity
                  onPress={() => handleRemoveSubject(index)}
                  style={styles.closeButton}
                >
                  <MaterialIcons
                    name="close"
                    size={18}
                    color={`${theme.primary}99`}
                  />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Save Button */}
      <View
        style={[
          styles.bottomContainer,
          { backgroundColor: theme.background },
        ]}
      >
        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: theme.primary }]}
        >
          <Text style={[styles.saveButtonText, { color: theme.gold }]}>
            Guardar Perfil
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingTop: 48,
  },
  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: '600',
    fontFamily: 'Playfair Display',
  },
  logoPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 120,
  },
  profileImageContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  profileImage: {
    width: 128,
    height: 128,
    borderRadius: 64,
    borderWidth: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  section: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 20,
  },
  subjectsSection: {
    marginBottom: 20,
  },
  subjectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Playfair Display',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  subjectsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  subjectTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  subjectText: {
    fontSize: 12,
    fontWeight: '500',
  },
  closeButton: {
    padding: 2,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 20,
  },
  saveButton: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
});
