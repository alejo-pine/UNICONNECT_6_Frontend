/**
 * Tarjeta individual de un compañero de clase.
 * Muestra nombre, carrera y semestre. Avatar con fallback de iniciales.
 */
import { useRouter } from "expo-router";
import React, { memo } from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { LIGHT_THEME } from "../../../theme/themeContext";
import type { Classmate } from "../types/search";

const colors = LIGHT_THEME;

interface ClassmateCardProps {
  classmate: Classmate;
}

const getInitials = (name: string): string =>
  name
    .split(" ")
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");

export const ClassmateCard = memo<ClassmateCardProps>(({ classmate }) => {
  const router = useRouter();
  const initials = getInitials(classmate.name);

  const handlePress = () => {
    // @ts-ignore - La ruta dinámica es válida en runtime
    router.push(`/public-profile/${classmate.id}`);
  };

  return (
    <TouchableOpacity 
      style={styles.card}
      activeOpacity={0.7}
      onPress={handlePress}
    >
      <View style={styles.avatarContainer}>
        {classmate.avatar_url ? (
          <Image
            source={{ uri: classmate.avatar_url }}
            style={styles.avatar}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.avatarFallback}>
            <Text style={styles.initials}>{initials}</Text>
          </View>
        )}
      </View>

      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {classmate.name}
        </Text>
        <Text style={styles.career} numberOfLines={1}>
          {classmate.career}
        </Text>
        {classmate.semester != null && (
          <Text style={styles.semester}>Semestre {classmate.semester}</Text>
        )}
      </View>
    </TouchableOpacity>
  );
});

ClassmateCard.displayName = "ClassmateCard";

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 1,
    gap: 14,
  },
  avatarContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: colors.primary,
  },
  avatar: {
    width: "100%",
    height: "100%",
  },
  avatarFallback: {
    width: "100%",
    height: "100%",
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  initials: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 2,
  },
  career: {
    fontSize: 13,
    color: colors.label,
    marginBottom: 2,
  },
  semester: {
    fontSize: 11,
    color: colors.gold,
    fontWeight: "600",
  },
});
