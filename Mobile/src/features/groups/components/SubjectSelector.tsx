/**
 * Componente: Selector de Materias Personalizado
 * Reemplaza al Picker nativo que se ve mal en iOS
 * Usa: Modal + FlatList + ButtonBase
 */

import { MaterialIcons } from '@expo/vector-icons';
import React, { memo, useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { groupsColors } from '../constants/colors';
import type { Subject } from '../services/subjectsHttpService';

interface SubjectSelectorProps {
  subjects: Subject[];
  selectedSubjectId: string;
  onSelectSubject: (subjectId: string) => void;
  disabled?: boolean;
  isLoading?: boolean;
}

const colors = groupsColors;

/**
 * Componente personalizado de selector de materias
 */
export const SubjectSelector = memo<SubjectSelectorProps>(
  ({ subjects, selectedSubjectId, onSelectSubject, disabled = false, isLoading = false }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const selectedSubject = useMemo(
      () => subjects.find((s) => s.id === selectedSubjectId),
      [subjects, selectedSubjectId]
    );

    const handleSelectSubject = useCallback(
      (subjectId: string) => {
        onSelectSubject(subjectId);
        setIsModalOpen(false);
      },
      [onSelectSubject]
    );

    const handleOpenModal = useCallback(() => {
      if (!disabled && !isLoading) {
        setIsModalOpen(true);
      }
    }, [disabled, isLoading]);

    const renderSubjectItem = ({ item }: { item: Subject }) => {
      const isSelected = item.id === selectedSubjectId;

      return (
        <TouchableOpacity
          style={[
            styles.subjectItem,
            isSelected && styles.subjectItemSelected,
            isSelected && { backgroundColor: colors.primary },
          ]}
          onPress={() => handleSelectSubject(item.id)}
          activeOpacity={0.6}
        >
          <Text
            style={[
              styles.subjectItemText,
              isSelected && { color: '#FFFFFF', fontWeight: '600' },
              !isSelected && { color: colors.text },
            ]}
          >
            {item.name}
          </Text>
          {isSelected && (
            <MaterialIcons name="check" size={20} color="#FFFFFF" />
          )}
        </TouchableOpacity>
      );
    };

    return (
      <>
        {/* Selector Button */}
        <TouchableOpacity
          style={[
            styles.selectorButton,
            {
              borderColor: colors.border,
              backgroundColor: colors.surface,
              opacity: disabled || isLoading ? 0.6 : 1,
            },
          ]}
          onPress={handleOpenModal}
          disabled={disabled || isLoading}
          activeOpacity={0.7}
        >
          <View style={styles.selectorContent}>
            <Text
              style={[
                styles.selectorText,
                selectedSubject
                  ? { color: colors.text, fontWeight: '500' }
                  : { color: colors.label },
              ]}
              numberOfLines={1}
            >
              {selectedSubject?.name || 'Selecciona una materia'}
            </Text>
            {isLoading && (
              <MaterialIcons name="hourglass-empty" size={16} color={colors.label} />
            )}
            {!isLoading && (
              <MaterialIcons name="expand-more" size={20} color={colors.primary} />
            )}
          </View>
        </TouchableOpacity>

        {/* Badge: Materia seleccionada */}
        {selectedSubject && !isLoading && (
          <View style={styles.selectedBadge}>
            <MaterialIcons name="check-circle" size={14} color={colors.primary} />
            <Text style={[styles.selectedBadgeText, { color: colors.primary }]}>
              {selectedSubject.name} seleccionada
            </Text>
          </View>
        )}

        {/* Modal de selección */}
        <Modal
          visible={isModalOpen}
          animationType="fade"
          transparent
          onRequestClose={() => setIsModalOpen(false)}
        >
          <View style={styles.modalOverlay}>
            <Pressable style={styles.modalBackdrop} onPress={() => setIsModalOpen(false)} />
            <View style={styles.modalCard}>
              <View style={styles.modalHeaderRow}>
                <Text style={styles.modalTitle}>Selecciona una Materia</Text>
                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={() => setIsModalOpen(false)}
                  activeOpacity={0.7}
                >
                  <MaterialIcons name="close" size={20} color={colors.label} />
                </TouchableOpacity>
              </View>

              {subjects.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <MaterialIcons name="info-outline" size={48} color={colors.border} />
                  <Text style={[styles.emptyText, { color: colors.label }]}>
                    No hay materias disponibles
                  </Text>
                </View>
              ) : (
                <FlatList
                  data={subjects}
                  renderItem={renderSubjectItem}
                  keyExtractor={(item) => item.id}
                  contentContainerStyle={styles.listContent}
                  showsVerticalScrollIndicator={false}
                  bounces={false}
                />
              )}
            </View>
          </View>
        </Modal>
      </>
    );
  }
);

SubjectSelector.displayName = 'SubjectSelector';

const styles = StyleSheet.create({
  selectorButton: {
    borderWidth: 2,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectorContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectorText: {
    fontSize: 16,
    flex: 1,
    marginRight: 8,
  },
  selectedBadge: {
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
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlay,
  },
  modalCard: {
    width: '88%',
    maxHeight: '70%',
    backgroundColor: colors.surface,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    flex: 1,
  },
  modalCloseButton: {
    padding: 4,
    marginLeft: 8,
  },
  listContent: {
    paddingBottom: 8,
  },
  subjectItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: colors.surface,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  subjectItemSelected: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  subjectItemText: {
    fontSize: 15,
    flex: 1,
  },
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
  },
});
