/**
 * Componente: Formulario para crear un nuevo grupo de estudio
 * Responsabilidad: Renderizar el formulario y capturar datos del usuario
 * La lógica HTTP y validación está en el hook useCreateStudyGroup
 */

import { MaterialIcons } from '@expo/vector-icons';
import React, { memo, useCallback, useState } from 'react';
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { groupsColors } from '../constants/colors';
import type { Subject } from '../services/subjectsHttpService';
import type { StudyGroupCreatePayload } from '../types/groups';
import { SubjectSelector } from './SubjectSelector';

interface CreateGroupFormProps {
  subjects: Subject[];
  isLoadingSubjects: boolean;
  isLoading: boolean;
  onSubmit: (payload: StudyGroupCreatePayload) => Promise<void>;
}

const colors = groupsColors;

/**
 * Componente del formulario de creación de grupo
 */
export const CreateGroupForm = memo<CreateGroupFormProps>(
  ({ subjects, isLoadingSubjects, isLoading, onSubmit }) => {
    const [groupName, setGroupName] = useState('');
    const [groupDescription, setGroupDescription] = useState('');
    const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');

    const handleSubmit = useCallback(async () => {
      const payload: StudyGroupCreatePayload = {
        name: groupName,
        description: groupDescription,
        subject_id: selectedSubjectId,
      };

      await onSubmit(payload);

      // Si llegamos aquí sin error, limpiar formulario
      // (Nota: la redirección ocurre en el componente padre)
      setGroupName('');
      setGroupDescription('');
    }, [groupName, groupDescription, selectedSubjectId, onSubmit]);

    const isFormValid =
      groupName.trim().length > 0 &&
      groupDescription.trim().length > 0 &&
      selectedSubjectId.trim().length > 0;

    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Tarjeta del formulario */}
        <View style={styles.formCard}>
          {/* Campo: Nombre del Grupo */}
          <View style={styles.fieldContainer}>
            <Text style={[styles.label, { color: colors.primary }]}>NOMBRE DEL GRUPO</Text>
            <TextInput
              style={[
                styles.textInput,
                {
                  borderColor: groupName.trim() ? colors.primary : colors.border,
                  color: colors.text,
                },
              ]}
              placeholder="ej: Final de Móviles - Grupo 2"
              placeholderTextColor={colors.placeholder}
              value={groupName}
              onChangeText={setGroupName}
              editable={!isLoading}
              maxLength={100}
            />
          </View>

          {/* Campo: Descripción */}
          <View style={styles.fieldContainer}>
            <Text style={[styles.label, { color: colors.primary }]}>DESCRIPCIÓN</Text>
            <TextInput
              style={[
                styles.textAreaInput,
                {
                  borderColor: groupDescription.trim() ? colors.primary : colors.border,
                  color: colors.text,
                },
              ]}
              placeholder="Grupo para coordinar el trabajo final y compartir recursos de aprendizaje..."
              placeholderTextColor={colors.placeholder}
              value={groupDescription}
              onChangeText={setGroupDescription}
              editable={!isLoading}
              multiline
              numberOfLines={4}
              maxLength={500}
              textAlignVertical="top"
            />
          </View>

          {/* Campo: Materia */}
          <View style={styles.fieldContainer}>
            <Text style={[styles.label, { color: colors.primary }]}>MATERIA</Text>

            {isLoadingSubjects ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={{ color: colors.label, marginLeft: 8 }}>
                  Cargando materias...
                </Text>
              </View>
            ) : subjects.length > 0 ? (
              <SubjectSelector
                subjects={subjects}
                selectedSubjectId={selectedSubjectId}
                onSelectSubject={setSelectedSubjectId}
                disabled={isLoading}
                isLoading={isLoadingSubjects}
              />
            ) : (
              <View style={[styles.emptySubjectsContainer, { borderColor: colors.error }]}>
                <MaterialIcons name="error-outline" size={20} color={colors.error} />
                <Text style={[styles.emptySubjectsText, { color: colors.error }]}>
                  No hay materias disponibles
                </Text>
              </View>
            )}
          </View>

          {/* Botón: Crear Grupo */}
          <View style={styles.submitContainer}>
            <TouchableOpacity
              style={[
                styles.submitButton,
                {
                  backgroundColor: isFormValid && !isLoading ? colors.accent : '#E5E7EB',
                  opacity: isFormValid && !isLoading ? 1 : 0.6,
                },
              ]}
              onPress={handleSubmit}
              disabled={!isFormValid || isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <>
                  <MaterialIcons name="group-add" size={20} color={colors.primary} />
                  <Text style={[styles.submitButtonText, { color: colors.primary }]}>
                    CREAR GRUPO
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Pie de página: Términos */}
        <View style={styles.footerContainer}>
          <Text style={[styles.footerText, { color: colors.label }]}>
            Al crear un grupo, aceptas las normas de convivencia de{' '}
            <Text style={[styles.footerTextBold, { color: colors.primary }]}>UniConnect</Text>.
          </Text>
        </View>
      </ScrollView>
    );
  }
);

CreateGroupForm.displayName = 'CreateGroupForm';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.lightBg,
  },
  contentContainer: {
    padding: 16,
    flexGrow: 1,
    justifyContent: 'center',
  },
  formCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 24,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  fieldContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 2,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: colors.surface,
  },
  textAreaInput: {
    borderWidth: 2,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: colors.surface,
    minHeight: 100,
  },
  pickerContainer: {
    borderWidth: 2,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  picker: {
    fontSize: 16,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 8,
    backgroundColor: colors.surface,
  },
  emptySubjectsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderWidth: 2,
    borderRadius: 8,
    backgroundColor: '#FEF2F2',
  },
  emptySubjectsText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  selectedBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#EFF6FF',
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  selectedBadgeText: {
    marginLeft: 6,
    fontSize: 13,
    fontWeight: '500',
  },
  submitContainer: {
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  submitButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 8,
    gap: 8,
  },
  submitButtonText: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
  },
  footerContainer: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  footerText: {
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
  },
  footerTextBold: {
    fontWeight: '600',
  },
});
