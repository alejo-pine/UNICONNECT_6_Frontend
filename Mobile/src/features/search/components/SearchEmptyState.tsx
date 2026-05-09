/**
 * Estado vacío de la pantalla de búsqueda.
 * Cubre tres casos: idle, sin resultados, y error.
 */
import { MaterialIcons } from "@expo/vector-icons";
import React, { memo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { LIGHT_THEME } from "../../../theme/themeContext";

const colors = LIGHT_THEME;

type EmptyStateType = "idle" | "empty" | "error";

interface SearchEmptyStateProps {
  type: EmptyStateType;
  errorMessage?: string | null;
  subjectName?: string;
}

const CONFIG: Record<
  EmptyStateType,
  { icon: React.ComponentProps<typeof MaterialIcons>["name"]; title: string }
> = {
  idle: {
    icon: "search",
    title: "Encuentra a tus compañeros",
  },
  empty: {
    icon: "people-outline",
    title: "Sin compañeros encontrados",
  },
  error: {
    icon: "cloud-off",
    title: "Algo salió mal",
  },
};

export const SearchEmptyState = memo<SearchEmptyStateProps>(
  ({ type, errorMessage, subjectName }) => {
    const { icon, title } = CONFIG[type];

    const description =
      type === "idle"
        ? "Selecciona una materia y busca quién más la está cursando."
        : type === "empty"
          ? subjectName
            ? `No hay otros estudiantes inscritos en "${subjectName}" por ahora.`
            : "No hay otros estudiantes inscritos en esta materia por ahora."
          : (errorMessage ??
            "No se pudo completar la búsqueda. Intenta de nuevo.");

    const iconColor = type === "error" ? colors.error : colors.gold;

    return (
      <View style={styles.container}>
        <MaterialIcons name={icon} size={56} color={iconColor} />
        <Text style={[styles.title, type === "error" && styles.titleError]}>
          {title}
        </Text>
        <Text style={styles.description}>{description}</Text>
      </View>
    );
  },
);

SearchEmptyState.displayName = "SearchEmptyState";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 12,
    marginTop: 32,
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.text,
    textAlign: "center",
  },
  titleError: {
    color: colors.error,
  },
  description: {
    fontSize: 14,
    color: colors.label,
    textAlign: "center",
    lineHeight: 20,
  },
});
