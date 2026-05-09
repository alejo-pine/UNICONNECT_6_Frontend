import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuthStore } from '../../../store/authStore';
import { useAuthLogin } from '../hooks/useAuthLogin';

const LOGIN_COLORS = {
  background: '#002147',
  white: '#FFFFFF',
  card: '#F7F7F7',
  darkButton: '#03254C',
  gold: '#C6A96A',
  subtitle: '#A9B7C8',
  muted: '#6B7280',
  warning: '#B08D57',
  error: '#B00020',
};

export function LoginScreen() {
  const { canLogin, errorMessage, isLoading, handleLogin, loginUnavailableReason } = useAuthLogin();
  const { setSession } = useAuthStore();
  
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Mostrar Alert nativo cuando hay error
  useEffect(() => {
    if (errorMessage) {
      Alert.alert(
        '⚠️ Error de inicio de sesión',
        errorMessage,
        [{ text: 'Entendido', style: 'default' }],
        { cancelable: true }
      );
    }
  }, [errorMessage]);

  /**
   * Manejador del botón de login
   * Memoizado para evitar recreaciones en cada render
   */
  const onPressLogin = useCallback(async () => {
    const user = await handleLogin();
    
    if (user) {
      setIsRedirecting(true);
      await setSession({
        userId: user.userId,
        token: user.token,
        needsOnboarding: user.needsOnboarding,
      });
      
      // Usar requestAnimationFrame en lugar de setTimeout (más confiable)
      requestAnimationFrame(() => {
        router.replace(user.needsOnboarding ? '/(onboarding)/welcome' : '/(tabs)');
      });
    } else {
      setIsRedirecting(false);
    }
  }, [handleLogin, setSession]);

  const showSpinner = isLoading || isRedirecting;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView 
        contentContainerStyle={styles.scrollViewContent}
        scrollEnabled={true}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View style={styles.topSection}>
          <View style={styles.logoCircle}>
            <Image
              source={require('../../../../assets/images/logo-ucaldas.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.brandTitle}>UniConnect</Text>
          <Text style={styles.brandSubtitle}>Conecta con tu comunidad universitaria</Text>
        </View>

        <View style={styles.bottomCard}>
          <Text style={styles.welcomeTitle}>¡Bienvenido!</Text>
          <Text style={styles.welcomeSubtitle}>
            Inicia sesión con tu correo institucional para acceder a la plataforma.
          </Text>

          <Pressable
            style={({ pressed }) => [
              styles.googleButton,
              (pressed || showSpinner || !canLogin) && styles.googleButtonPressed,
            ]}
            onPress={onPressLogin}
            disabled={!canLogin || showSpinner}>
            {showSpinner ? (
              <View style={styles.spinnerContainer}>
                <ActivityIndicator color={LOGIN_COLORS.white} size="large" />
              </View>
            ) : (
              <View style={styles.googleButtonContent}>
                <FontAwesome name="google" size={18} color={LOGIN_COLORS.white} />
                <Text style={styles.googleButtonText}>Continuar con Google</Text>
              </View>
            )}
          </Pressable>

          <View style={styles.validationRow}>
            <Ionicons name="information-circle-outline" size={14} color={LOGIN_COLORS.warning} />
            <Text style={styles.validationText}>
              Solo correos <Text style={styles.validationDomain}>@ucaldas.edu.co</Text>
            </Text>
          </View>

          {!canLogin && loginUnavailableReason ? (
            <Text style={styles.loginUnavailableText}>{loginUnavailableReason}</Text>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: LOGIN_COLORS.background,
  },
  scrollViewContent: {
    flexGrow: 1,
    justifyContent: 'space-between',
  },
  topSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  logoCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    padding: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  logo: {
    width: '100%',
    height: '100%',
    borderRadius: 64,
  },
  brandTitle: {
    color: LOGIN_COLORS.white,
    fontSize: 48,
    fontWeight: '700',
    marginBottom: 8,
  },
  brandSubtitle: {
    color: LOGIN_COLORS.subtitle,
    fontSize: 18,
    textAlign: 'center',
  },
  bottomCard: {
    backgroundColor: LOGIN_COLORS.card,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: Platform.OS === 'ios' ? 40 : 32,
    width: '100%',
  },
  welcomeTitle: {
    fontSize: 34,
    fontWeight: '700',
    color: LOGIN_COLORS.darkButton,
    textAlign: 'center',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: LOGIN_COLORS.muted,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  googleButton: {
    height: 56,
    borderRadius: 14,
    backgroundColor: LOGIN_COLORS.darkButton,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  googleButtonPressed: {
    opacity: 0.75,
  },
  googleButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  spinnerContainer: {
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  googleButtonText: {
    color: LOGIN_COLORS.white,
    fontWeight: '700',
    fontSize: 19,
  },
  validationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 8,
  },
  validationText: {
    color: LOGIN_COLORS.muted,
    fontSize: 14,
  },
  validationDomain: {
    color: LOGIN_COLORS.warning,
    fontWeight: '700',
  },
  loginUnavailableText: {
    marginTop: 8,
    textAlign: 'center',
    color: LOGIN_COLORS.error,
    fontSize: 12,
    lineHeight: 16,
  },
});
