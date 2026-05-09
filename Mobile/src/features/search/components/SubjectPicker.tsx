/**
 * Selector de materia con tres estados: loading, error, lista.
 * Implementación cross-platform usando Modal para consistencia en iOS y Android.
 */
import { MaterialIcons } from "@expo/vector-icons";
import React, { memo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { LIGHT_THEME } from "../../../theme/themeContext";
import type { SearchSubject } from "../types/search";

const colors = LIGHT_THEME;

interface SubjectPickerProps {
  subjects: SearchSubject[];
  selectedSubject: SearchSubject | null;
  loading: boolean;
  error: string | null;
  onSelect: (subject: SearchSubject) => void;
  /** Llamado cuando el usuario vuelve a la opción vacía del picker */
  onClear?: () => void;
}

export const SubjectPicker = memo<SubjectPickerProps>(
  ({ subjects, selectedSubject, loading, error, onSelect, onClear }) => {
    const [modalVisible, setModalVisible] = useState(false);

    const handleSelectSubject = (subject: SearchSubject) => {
      onSelect(subject);
      setModalVisible(false);
    };

    const handleClear = () => {
      onClear?.();
      setModalVisible(false);
    };

    if (loading) {
      return (
        <View style={styles.feedbackRow}>
          <ActivityIndicator size="small" color={colors.gold} />
          <Text style={styles.feedbackText}>Cargando materias...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={[styles.feedbackRow, styles.errorBox]}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      );
    }

    return (
      <View>
        <Text style={styles.label}>MATERIA</Text>
        
        {/* Selector Button */}
        <TouchableOpacity
          style={styles.selectorButton}
          onPress={() => setModalVisible(true)}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.selectorText,
              !selectedSubject && styles.placeholderText,
            ]}
          >
            {selectedSubject?.name ?? "Selecciona una materia..."}
          </Text>
          <MaterialIcons name="arrow-drop-down" size={24} color={colors.gold} />
        </TouchableOpacity>

        {/* Modal with Subject List */}
        <Modal
          visible={modalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setModalVisible(false)}
        >
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setModalVisible(false)}
          >
            <View style={styles.modalContent}>
              {/* Header */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Selecciona una materia</Text>
                <TouchableOpacity
                  onPress={() => setModalVisible(false)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <MaterialIcons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>

              {/* Subject List */}
              <FlatList
                data={subjects}
                keyExtractor={(item) => item.id}
                style={styles.subjectList}
                ListHeaderComponent={
                  selectedSubject ? (
                    <TouchableOpacity
                      style={[styles.subjectItem, styles.clearOption]}
                      onPress={handleClear}
                    >
                      <MaterialIcons name="clear" size={20} color={colors.label} />
                      <Text style={styles.clearText}>Limpiar selección</Text>
                    </TouchableOpacity>
                  ) : null
                }
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.subjectItem,
                      selectedSubject?.id === item.id && styles.selectedItem,
                    ]}
                    onPress={() => handleSelectSubject(item)}
                  >
                    <Text
                      style={[
                        styles.subjectItemText,
                        selectedSubject?.id === item.id &&
                          styles.selectedItemText,
                      ]}
                    >
                      {item.name}
                    </Text>
                    {selectedSubject?.id === item.id && (
                      <MaterialIcons name="check" size={20} color={colors.gold} />
                    )}
                  </TouchableOpacity>
                )}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
              />
            </View>
          </Pressable>
        </Modal>
      </View>
    );
  },
);

SubjectPicker.displayName = "SubjectPicker";

const styles = StyleSheet.create({
  label: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.label,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  selectorButton: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  selectorText: {
    fontSize: 16,
    color: colors.text,
    flex: 1,
  },
  placeholderText: {
    color: colors.label,
  },
  feedbackRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 14,
  },
  feedbackText: {
    fontSize: 14,
    color: colors.label,
  },
  errorBox: {
    backgroundColor: "#FEE2E2",
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  errorText: {
    color: colors.error,
    fontSize: 13,
    flexShrink: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    width: "100%",
    maxHeight: "70%",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
  },
  subjectList: {
    paddingHorizontal: 20,
  },
  subjectItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
  },
  subjectItemText: {
    fontSize: 16,
    color: colors.text,
    flex: 1,
  },
  selectedItem: {
    backgroundColor: colors.background,
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  selectedItemText: {
    fontWeight: "600",
    color: colors.gold,
  },
  separator: {
    height: 1,
    backgroundColor: colors.border,
  },
  clearOption: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 8,
  },
  clearText: {
    fontSize: 15,
    color: colors.label,
    fontWeight: "500",
  },
});
