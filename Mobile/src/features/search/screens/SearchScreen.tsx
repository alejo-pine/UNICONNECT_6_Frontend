/**
 * Pantalla de búsqueda de compañeros por materia (US-005).
 * Orquesta los hooks de materias y compañeros, y coordina la UI.
 */
import { MaterialIcons } from "@expo/vector-icons";
import { Stack, useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LIGHT_THEME } from "../../../theme/themeContext";
import { ClassmateList } from "../components/ClassmateList";
import { SearchEmptyState } from "../components/SearchEmptyState";
import { SubjectPicker } from "../components/SubjectPicker";
import { useClassmates } from "../hooks/useClassmates";
import { useSubjectSearch } from "../hooks/useSubjectSearch";
import type { SearchSubject } from "../types/search";

const colors = LIGHT_THEME;

export const SearchScreen: React.FC = () => {
  const {
    subjects,
    selectedSubject,
    loadingSubjects,
    subjectsError,
    selectSubject,
    clearSelection,
    loadSubjects,
  } = useSubjectSearch();

  const { classmates, status, error, searchClassmates, reset } =
    useClassmates();

  // Controla si se muestra el aviso de validación
  const [showValidation, setShowValidation] = useState(false);

  // Recargar materias cada vez que la pantalla vuelve al foco
  // Esto asegura que si el usuario actualiza sus materias en el perfil,
  // se reflejen inmediatamente al volver a la búsqueda
  useFocusEffect(
    useCallback(() => {
      // Limpiar selección antes de recargar para evitar inconsistencias
      clearSelection();
      reset();
      setShowValidation(false);
      loadSubjects();
    }, [loadSubjects, clearSelection, reset]),
  );

  // Al seleccionar una materia válida: limpia resultados anteriores y oculta el aviso
  const handleSelectSubject = useCallback(
    (subject: SearchSubject) => {
      selectSubject(subject);
      reset();
      setShowValidation(false);
    },
    [selectSubject, reset],
  );

  // Al volver a la opción vacía del picker: limpia selección y resultados
  const handleClearSubject = useCallback(() => {
    clearSelection();
    reset();
    setShowValidation(false);
  }, [clearSelection, reset]);

  const handleSearch = useCallback(async () => {
    if (!selectedSubject) {
      setShowValidation(true);
      return;
    }
    setShowValidation(false);
    await searchClassmates(selectedSubject.id);
  }, [selectedSubject, searchClassmates]);

  const renderContent = () => {
    if (status === "loading") {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.gold} />
          <Text style={styles.loadingText}>Buscando compañeros...</Text>
        </View>
      );
    }

    if (status === "success") {
      return <ClassmateList classmates={classmates} />;
    }

    if (status === "empty") {
      return (
        <SearchEmptyState type="empty" subjectName={selectedSubject?.name} />
      );
    }

    if (status === "error") {
      return <SearchEmptyState type="error" errorMessage={error} />;
    }

    // idle
    return <SearchEmptyState type="idle" />;
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: "Buscar Compañeros",
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: "#FFFFFF",
          headerTitleStyle: { fontWeight: "600", fontSize: 18 },
        }}
      />

      <SafeAreaView
        style={styles.container}
        edges={["left", "right", "bottom"]}
      >
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          {/* Panel superior: selector y botón de búsqueda */}
          <View style={styles.searchPanel}>
            <SubjectPicker
              subjects={subjects}
              selectedSubject={selectedSubject}
              loading={loadingSubjects}
              error={subjectsError}
              onSelect={handleSelectSubject}
              onClear={handleClearSubject}
            />

            {/* Aviso de validación — aparece al pulsar Buscar sin materia seleccionada */}
            {showValidation && !selectedSubject && (
              <View style={styles.warningRow}>
                <MaterialIcons name="warning" size={14} color={colors.gold} />
                <Text style={styles.warningText}>
                  Debes seleccionar una materia para iniciar la búsqueda.
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={[
                styles.searchButton,
                status === "loading" && styles.searchButtonDisabled,
              ]}
              onPress={handleSearch}
              disabled={status === "loading"}
              activeOpacity={0.8}
            >
              <MaterialIcons name="search" size={18} color="#FFFFFF" />
              <Text style={styles.searchButtonText}>BUSCAR COMPAÑEROS</Text>
            </TouchableOpacity>
          </View>

          {/* Cabecera de resultados */}
          {status === "success" && (
            <View style={styles.resultsHeader}>
              <Text style={styles.resultsCount}>
                {classmates.length}{" "}
                {classmates.length === 1 ? "compañero" : "compañeros"}{" "}
                encontrados
              </Text>
              <Text style={styles.resultsSubject}>{selectedSubject?.name}</Text>
            </View>
          )}

          {/* Área de contenido dinámica */}
          <View style={[styles.flex, styles.contentArea]}>
            {renderContent()}
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  searchPanel: {
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 12,
  },
  warningRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#FEF3C7",
    borderRadius: 8,
  },
  warningText: {
    fontSize: 13,
    color: "#92400E",
    fontWeight: "500",
  },
  searchButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
  },
  searchButtonDisabled: {
    opacity: 0.45,
  },
  searchButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 1,
  },
  resultsHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  resultsCount: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
  },
  resultsSubject: {
    fontSize: 12,
    color: colors.gold,
    marginTop: 2,
    fontWeight: "600",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: colors.label,
  },
  contentArea: {
    paddingHorizontal: 16,
  },
});
