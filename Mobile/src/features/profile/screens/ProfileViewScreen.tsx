import { MaterialIcons } from "@expo/vector-icons";
import { Stack, useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect } from "react";
import {
    ActivityIndicator,
    Image,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import {
    SafeAreaView,
} from "react-native-safe-area-context";
import { useAuthStore } from "../../../store/authStore";
import { LIGHT_THEME } from "../../../theme/themeContext";
import { ProfileInfoItem } from "../components/ProfileInfoItem";
import { SectionHeader } from "../components/SectionHeader";
import { SubjectsDisplay } from "../components/SubjectsDisplay";
import { useLoadProfileSubjects } from "../hooks/useLoadProfileSubjects";
import { useProfileLoad } from "../hooks/useProfileLoad";
import { ProfileData } from "../types/profile";

const colors = LIGHT_THEME;

interface ProfileViewScreenProps {
  profileData?: ProfileData;
}

export const ProfileViewScreen: React.FC<ProfileViewScreenProps> = ({
  profileData,
}) => {
  const router = useRouter();
  const footerBottomOffset = 14;
  const { userId, token } = useAuthStore();

  const { profile, loading, loadProfile } = useProfileLoad();
  const {
    subjects: profileSubjects,
    loading: subjectsLoading,
    reload: reloadSubjects,
  } = useLoadProfileSubjects(userId || "", token || "");

  // Recargar perfil y materias cada vez que la pantalla entra en foco
  useFocusEffect(
    useCallback(() => {
      console.log("[ProfileViewScreen] Pantalla enfocada - cargando datos...");
      loadProfile();
      if (userId && token) {
        reloadSubjects();
      }
    }, [loadProfile, reloadSubjects, userId, token]),
  );

  // Usar datos pasados por props si están disponibles, de lo contrario usar los cargados
  const displayProfile = profileData || profile;

  // Logs de depuración al cambiar materias
  useEffect(() => {
    if (profileSubjects.length > 0) {
      console.log(
        "[ProfileViewScreen] Materias cargadas del backend:",
        profileSubjects.length,
        "items",
      );
      console.log("[ProfileViewScreen] Materias:", profileSubjects);
    } else if (!subjectsLoading) {
      console.log("[ProfileViewScreen] No hay materias cargadas");
    }
  }, [profileSubjects, subjectsLoading]);

  if (loading && !displayProfile) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: 10, color: colors.label }}>
          Actualizando perfil...
        </Text>
      </View>
    );
  }

  if (!displayProfile) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <MaterialIcons name="error-outline" size={48} color={colors.label} />
        <Text style={{ marginTop: 10, color: colors.label }}>
          Perfil no disponible
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right", "bottom"]}>
      <Stack.Screen
        options={{
          title: "Perfil",
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: "#fff",
          headerTitleStyle: { fontWeight: "600", fontSize: 18 },
        }}
      />

      <ScrollView
        style={styles.scrollView}
        // Ajustamos el padding inferior del scroll para que el contenido no quede detrás del botón
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: 112 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.profileHeader}>
          <View
            style={[styles.avatarContainer, { borderColor: colors.surface }]}
          >
            <Image
              source={{
                uri:
                  displayProfile.avatar_url ||
                  "https://via.placeholder.com/150",
              }}
              style={styles.avatar}
            />
          </View>
          <Text style={[styles.name, { color: colors.primary }]}>
            {displayProfile.name || "Usuario"}
          </Text>
          <Text style={[styles.university, { color: colors.label }]}>
            {displayProfile.email || "Usuario sin correo"}
          </Text>
        </View>

        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <SectionHeader title="Información Académica" />
          <ProfileInfoItem
            icon="school"
            label="Programa"
            value={displayProfile.career || "No especificado"}
          />
          <ProfileInfoItem
            icon="calendar-today"
            label="Semestre Actual"
            value={
              displayProfile.semester
                ? `${displayProfile.semester}º Semestre`
                : "No especificado"
            }
          />
        </View>

        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <SectionHeader title="Información de Contacto" />
          <ProfileInfoItem
            icon="phone"
            label="Teléfono"
            value={displayProfile.phone_number || "No especificado"}
          />
        </View>

        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <SectionHeader title="Materias Actuales" />
          {subjectsLoading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <SubjectsDisplay subjects={profileSubjects} />
          )}
        </View>
      </ScrollView>
      {/* FOOTER AJUSTADO PARA IPHONE */}
      <View
        style={[
          styles.footer,
          {
            backgroundColor: colors.surface,
            paddingBottom: Platform.OS === 'ios' ? 10 : 12,
            bottom: footerBottomOffset,
          },
        ]}
      >
        <TouchableOpacity
          style={[styles.actionButton, styles.editButton, { backgroundColor: colors.primary }]}
          onPress={() => {
            router.push({
              pathname: "/profile/edit-profile",
              params: { initialData: JSON.stringify(displayProfile) },
            });
          }}
          activeOpacity={0.9}
        >
          <MaterialIcons name="edit" size={20} color="#FFFFFF" />
          <Text style={[styles.editButtonText, { color: '#FFFFFF' }]}>EDITAR PERFIL</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centerContent: { justifyContent: "center", alignItems: "center" },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 20 },
  profileHeader: { alignItems: "center", marginBottom: 28 },
  avatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    overflow: "hidden",
    marginBottom: 16,
    elevation: 4,
  },
  avatar: { width: "100%", height: "100%" },
  name: { fontSize: 24, fontWeight: "700", marginBottom: 4 },
  university: { fontSize: 14, fontWeight: "500" },
  section: { borderRadius: 12, padding: 16, marginBottom: 16, elevation: 1 },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 10,
    minHeight: 72,
    justifyContent: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    minHeight: 52,
  },
  editButton: {
    borderWidth: 0,
  },
  editButtonText: { fontSize: 14, fontWeight: "700", letterSpacing: 1 },
});
