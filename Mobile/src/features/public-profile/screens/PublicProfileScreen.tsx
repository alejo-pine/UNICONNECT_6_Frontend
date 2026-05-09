/**
 * Pantalla de Perfil Público de Estudiante
 * Muestra la información pública de otro estudiante
 * Evita antipatrones: lógica de negocio en componente, useEffect sin dependencias
 */
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback } from "react";
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useChatStore } from "../../../store/chatStore";
import { ContactSection } from "../components/ContactSection";
import { PublicProfileHeader } from "../components/PublicProfileHeader";
import { SubjectsSection } from "../components/SubjectsSection";
import { usePublicProfile } from "../hooks/usePublicProfile";

export const PublicProfileScreen: React.FC = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const profileId = params.id || "";

  // Custom hook que maneja la lógica de fetch y estados
  const { profile, isLoading, error, refetch } = usePublicProfile(profileId);
  const getOrCreateConversation = useChatStore(
    (state) => state.getOrCreateConversation,
  );
  const [isStartingChat, setIsStartingChat] = React.useState(false);

  // Memoizar callback de reintentar para evitar re-renders innecesarios
  const handleRetry = useCallback(() => refetch(), [refetch]);

  const handleStartChat = async () => {
    if (!profile) return;
    setIsStartingChat(true);
    try {
      const convId = await getOrCreateConversation(profileId);
      if (convId) {
        router.push({
          pathname: `/chat/${convId}` as any,
          params: { partnerName: profile.full_name },
        });
      }
    } finally {
      setIsStartingChat(false);
    }
  };

  // Estado de carga
  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#002147" />
        <Text style={styles.loadingText}>Cargando perfil...</Text>
      </View>
    );
  }

  // Estado de error
  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
        <Text style={styles.errorTitle}>Error al cargar el perfil</Text>
        <Text style={styles.errorMessage}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
          <Text style={styles.retryButtonText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Si no hay perfil después de cargar (no debería ocurrir si no hay error)
  if (!profile) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="person-outline" size={64} color="#9CA3AF" />
        <Text style={styles.errorTitle}>Perfil no encontrado</Text>
      </View>
    );
  }

  // Renderizado principal con datos
  return (
    <View style={styles.container}>
      {/* Header con botón de atrás */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Perfil del Compañero</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Contenido scrolleable */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header del perfil: avatar, nombre, carrera, semestre */}
        <PublicProfileHeader
          fullName={profile.full_name}
          career={profile.career}
          semester={profile.semester}
          avatarUrl={profile.avatar_url}
        />

        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={styles.chatButton}
            onPress={handleStartChat}
            disabled={isStartingChat}
            activeOpacity={0.8}
          >
            {isStartingChat ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Ionicons
                  name="chatbubble-ellipses"
                  size={20}
                  color="#FFFFFF"
                  style={styles.chatIcon}
                />
                <Text style={styles.chatButtonText}>Enviar mensaje</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Sección de materias inscritas */}
        <SubjectsSection subjects={profile.subjects} />

        {/* Sección de contacto con funcionalidad de copiar */}
        <ContactSection phoneNumber={profile.phone_number} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  header: {
    backgroundColor: "#002147", // Azul oscuro institucional
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 48,
    paddingBottom: 16,
    paddingHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginRight: 32, // Compensar el botón de atrás para centrar el título
  },
  headerSpacer: {
    width: 32,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
    backgroundColor: "#F5F5F5",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#4B5563",
  },
  errorTitle: {
    marginTop: 16,
    fontSize: 20,
    fontWeight: "bold",
    color: "#1F2937",
    textAlign: "center",
  },
  errorMessage: {
    marginTop: 8,
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    paddingHorizontal: 32,
  },
  retryButton: {
    marginTop: 24,
    backgroundColor: "#002147",
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  actionContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
    alignItems: "center",
  },
  chatButton: {
    backgroundColor: "#00284D",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chatButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  chatIcon: {
    marginRight: 8,
  },
});
