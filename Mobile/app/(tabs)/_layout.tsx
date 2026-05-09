import { profileService } from "@/src/services/profileService";
import { useAuthStore } from "@/src/store/authStore";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { Drawer } from "expo-router/drawer";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ProfileData } from "@/src/features/profile/types/profile";
import {
  DrawerContentComponentProps,
  DrawerContentScrollView,
  DrawerItem,
} from "@react-navigation/drawer";

const PLATFORM_PRIMARY_BLUE = "#00284D";

function CustomDrawerContent(props: DrawerContentComponentProps) {
  const { clearSession, token, userId, profileRefreshKey } = useAuthStore();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const activeRouteName = props.state.routeNames[props.state.index];
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [avatarCacheBuster, setAvatarCacheBuster] = useState<number>(
    Date.now(),
  );

  const loadProfile = useCallback(async () => {
    if (!token || !userId) {
      setProfile(null);
      return;
    }

    setIsLoadingProfile(true);
    try {
      const response = await profileService.getProfileById(userId, token);
      if (response.success && response.data) {
        setProfile(response.data);
        setAvatarCacheBuster(Date.now());
      }
    } catch (error) {
      console.warn(
        "[Drawer] No se pudo cargar perfil para el menú lateral.",
        error,
      );
    } finally {
      setIsLoadingProfile(false);
    }
  }, [token, userId]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile, profileRefreshKey]);

  useEffect(() => {
    const unsubscribe = (props.navigation as any).addListener(
      "drawerOpen",
      () => {
        loadProfile();
      },
    );

    return unsubscribe;
  }, [loadProfile, props.navigation]);

  useEffect(() => {
    const unsubscribe = (props.navigation as any).addListener("focus", () => {
      loadProfile();
    });

    return unsubscribe;
  }, [loadProfile, props.navigation]);

  const displayName = useMemo(() => {
    return profile?.name?.trim() || "Usuario Uniconnect";
  }, [profile?.name]);

  const displayEmail = useMemo(() => {
    return profile?.email?.trim() || "Correo no disponible";
  }, [profile?.email]);

  const avatarUri = useMemo(() => {
    const value = profile?.avatar_url;
    if (!value || value.trim().length === 0) {
      return undefined;
    }

    const separator = value.includes("?") ? "&" : "?";
    return `${value}${separator}v=${avatarCacheBuster}`;
  }, [avatarCacheBuster, profile?.avatar_url]);

  const handleNavigate = (
    route: "index" | "explore" | "profile" | "events",
  ) => {
    props.navigation.navigate(route);
  };

  const handleLogoutWithConfirmation = () => {
    Alert.alert(
      "¿Cerrar sesión?",
      "¿Estás seguro de que deseas salir de tu cuenta?",
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Sí, salir",
          style: "destructive",
          onPress: async () => {
            await clearSession();
            router.replace("/login");
          },
        },
      ],
    );
  };

  return (
    <View style={styles.drawerContainer}>
      <DrawerContentScrollView
        {...props}
        contentContainerStyle={styles.drawerScrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[
            styles.profileSection,
            { paddingTop: Math.max(insets.top, 20) + 4 },
          ]}
        >
          <View style={styles.profileHeaderTopRow}>
            <View style={styles.avatarRing}>
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarFallback}>
                  <Ionicons name="person" size={28} color="#35526B" />
                </View>
              )}
            </View>
            <Ionicons name="sunny-outline" size={34} color="#C5A059" />
          </View>

          <View style={styles.profileTextContainer}>
            <Text style={styles.profileName} numberOfLines={1}>
              {displayName}
            </Text>
            {isLoadingProfile ? (
              <ActivityIndicator
                size="small"
                color="#B7C8DA"
                style={styles.profileLoading}
              />
            ) : (
              <Text style={styles.profileEmail} numberOfLines={1}>
                {displayEmail}
              </Text>
            )}
          </View>
        </View>

        <View style={styles.drawerItemsContainer}>
          <DrawerItem
            label="Pantalla principal"
            onPress={() => handleNavigate("index")}
            focused={activeRouteName === "index"}
            labelStyle={styles.drawerItemLabel}
            style={styles.drawerItem}
            icon={({ size, color }) => (
              <Ionicons name="home-outline" size={size} color={color} />
            )}
            activeTintColor="#F4D28C"
            inactiveTintColor="#FFFFFF"
            activeBackgroundColor="rgba(197, 160, 89, 0.18)"
          />

          <DrawerItem
            label="Buscar compañeros"
            onPress={() => handleNavigate("explore")}
            focused={activeRouteName === "explore"}
            labelStyle={styles.drawerItemLabel}
            style={styles.drawerItem}
            icon={({ size, color }) => (
              <Ionicons name="people-outline" size={size} color={color} />
            )}
            activeTintColor="#F4D28C"
            inactiveTintColor="#FFFFFF"
            activeBackgroundColor="rgba(197, 160, 89, 0.18)"
          />

          <DrawerItem
            label="Perfil"
            onPress={() => handleNavigate("profile")}
            focused={activeRouteName === "profile"}
            labelStyle={styles.drawerItemLabel}
            style={styles.drawerItem}
            icon={({ size, color }) => (
              <Ionicons
                name="person-circle-outline"
                size={size}
                color={color}
              />
            )}
            activeTintColor="#F4D28C"
            inactiveTintColor="#FFFFFF"
            activeBackgroundColor="rgba(197, 160, 89, 0.18)"
          />

          <DrawerItem
            label="Eventos"
            onPress={() => handleNavigate("events")}
            focused={activeRouteName === "events"}
            labelStyle={styles.drawerItemLabel}
            style={styles.drawerItem}
            icon={({ size, color }) => (
              <Ionicons name="calendar-outline" size={size} color={color} />
            )}
            activeTintColor="#F4D28C"
            inactiveTintColor="#FFFFFF"
            activeBackgroundColor="rgba(197, 160, 89, 0.18)"
          />

          <DrawerItem
            label="Bandeja de entrada"
            onPress={() => {
              props.navigation.closeDrawer();
              router.navigate("/chat/inbox" as any);
            }}
            labelStyle={styles.drawerItemLabel}
            style={styles.drawerItem}
            icon={({ size, color }) => (
              <Ionicons name="chatbubbles-outline" size={size} color={color} />
            )}
            inactiveTintColor="#FFFFFF"
          />

          <DrawerItem
            label="Grupos"
            onPress={() => {
              props.navigation.closeDrawer();
              router.navigate("/study-groups");
            }}
            labelStyle={styles.drawerItemLabel}
            style={styles.drawerItem}
            icon={({ size, color }) => (
              <Ionicons
                name="people-circle-outline"
                size={size}
                color={color}
              />
            )}
            inactiveTintColor="#FFFFFF"
          />
        </View>
      </DrawerContentScrollView>

      <View
        style={[
          styles.logoutContainer,
          { paddingBottom: Math.max(insets.bottom, 16) },
        ]}
      >
        <TouchableOpacity
          onPress={handleLogoutWithConfirmation}
          style={styles.logoutRow}
          accessibilityLabel="Cerrar sesión"
          accessibilityRole="button"
        >
          <Ionicons name="log-out-outline" size={20} color="#F4D28C" />
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function TabLayout() {
  const { token } = useAuthStore();
  const router = useRouter();

  // 🛑 EL GUARDIÁN INTELIGENTE
  // Solo se ejecuta si esta pantalla está ACTIVA y VISIBLE
  useFocusEffect(
    useCallback(() => {
      if (!token) {
        console.log(
          "[TabsLayout] Pestaña activa sin token. Echando al usuario...",
        );
        router.replace("/login");
      }
    }, [token, router]), // Reacciona si el token cambia mientras la miras
  );

  return (
    <Drawer
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: PLATFORM_PRIMARY_BLUE,
        },
        headerTintColor: "#FFFFFF",
        headerTitleStyle: {
          fontWeight: "600",
          fontSize: 17,
        },
        overlayColor: "rgba(0,0,0,0.6)",
        drawerStyle: styles.drawerStyle,
        drawerType: "front",
      }}
    >
      <Drawer.Screen
        name="index"
        options={{
          title: "Pantalla principal",
          drawerLabel: "Pantalla principal",
        }}
      />
      <Drawer.Screen
        name="explore"
        options={{
          title: "Buscar compañeros",
          drawerLabel: "Buscar compañeros",
        }}
      />
      <Drawer.Screen
        name="profile"
        options={{
          title: "Perfil",
          drawerLabel: "Perfil",
        }}
      />
      <Drawer.Screen
        name="events"
        options={{
          title: "Eventos",
          drawerLabel: "Eventos",
        }}
      />
    </Drawer>
  );
}

const styles = StyleSheet.create({
  drawerStyle: {
    width: "82%",
    maxWidth: 320,
    backgroundColor: PLATFORM_PRIMARY_BLUE,
  },
  drawerContainer: {
    flex: 1,
    backgroundColor: PLATFORM_PRIMARY_BLUE,
  },
  drawerScrollContent: {
    paddingTop: 0,
  },
  profileSection: {
    paddingHorizontal: 18,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  profileHeaderTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  avatarRing: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 2,
    borderColor: "#C5A059",
    overflow: "hidden",
    backgroundColor: "#E8D2AA",
    alignItems: "center",
    justifyContent: "center",
  },
  avatar: {
    width: "100%",
    height: "100%",
  },
  avatarFallback: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E8D2AA",
  },
  profileTextContainer: {
    marginTop: 14,
  },
  profileName: {
    color: "#FFFFFF",
    fontSize: 26,
    fontWeight: "700",
  },
  profileLoading: {
    marginTop: 8,
    alignSelf: "flex-start",
  },
  profileEmail: {
    color: "#B7C8DA",
    marginTop: 4,
    fontSize: 14,
  },
  drawerItemsContainer: {
    marginTop: 10,
    paddingHorizontal: 8,
    gap: 1,
  },
  drawerItem: {
    borderRadius: 10,
    marginHorizontal: 6,
  },
  drawerItemLabel: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
    marginLeft: -8,
  },
  logoutContainer: {
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.12)",
    paddingHorizontal: 20,
    paddingTop: 14,
  },
  logoutRow: {
    height: 44,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  logoutText: {
    color: "#F4D28C",
    fontSize: 17,
    fontWeight: "600",
  },
});
