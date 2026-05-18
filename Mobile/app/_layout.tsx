import { router, Stack, useSegments } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  AppState,
  AppStateStatus,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { AppErrorBoundary } from '../src/components/AppErrorBoundary';
import {
  getOnboardingStatus,
  OnboardingApiError,
} from '../src/features/onboarding/services/onboardingService';
import { useAuthStore } from '../src/store/authStore';
import { GlobalSocketNotifications } from '../src/components/GlobalSocketNotifications';

export default function RootLayout() {
  const segments = useSegments();
  const {
    token,
    onboardingResolved,
    needsOnboarding,
    hydrateSession,
    clearSession,
    setNeedsOnboarding,
    setOnboardingResolved,
  } = useAuthStore();

  const [isHydrating, setIsHydrating] = useState(true);
  const [isCheckingOnboarding, setIsCheckingOnboarding] = useState(false);
  const [onboardingError, setOnboardingError] = useState<string | null>(null);
  const lastOnboardingCheckAtRef = useRef(0);
  const APP_STATE_RECHECK_COOLDOWN_MS = 12000;

  const checkOnboardingStatus = useCallback(async (source: 'initial' | 'appState' | 'retry' = 'initial') => {
    if (!token) {
      return;
    }

    try {
      setIsCheckingOnboarding(true);
      const status = await getOnboardingStatus(token);
      setNeedsOnboarding(status.needsOnboarding);
      setOnboardingError(null);
      setOnboardingResolved(true);
      lastOnboardingCheckAtRef.current = Date.now();
    } catch (error) {
      if (error instanceof OnboardingApiError && [401, 403].includes(error.status)) {
        // Token persisted locally but user/session is no longer valid in backend.
        await clearSession();
        router.replace('/login');
        return;
      }

      if (source === 'appState') {
        // Returning from system pickers can briefly interrupt connectivity.
        // Keep last known auth/onboarding state and avoid blocking the app for transient failures.
        console.warn('[RootLayout] Revalidacion en foreground omitida por error transitorio:', error);
        return;
      }

      if (error instanceof OnboardingApiError) {
        setOnboardingError(
          `No se pudo validar onboarding (HTTP ${error.status}). Verifica backend/ngrok e intenta nuevamente.`
        );
        setOnboardingResolved(false);
        return;
      }

      setOnboardingError(
        'No se pudo validar tu estado de onboarding. Revisa tu conexion e intenta nuevamente.'
      );
      setOnboardingResolved(false);
    } finally {
      setIsCheckingOnboarding(false);
    }
  }, [clearSession, setNeedsOnboarding, setOnboardingResolved, token]);

  useEffect(() => {
    const runHydration = async () => {
      try {
        await hydrateSession();
      } catch (error) {
        // Prevent unhandled hydration failures from terminating the app in release builds.
        console.error('[RootLayout] Error hidratando sesion:', error);
        await clearSession();
      }
      setIsHydrating(false);
    };

    runHydration();
  }, [clearSession, hydrateSession]);

  useEffect(() => {
    if (isHydrating || !token || onboardingResolved || isCheckingOnboarding || Boolean(onboardingError)) {
      return;
    }

    checkOnboardingStatus('initial');
  }, [
    checkOnboardingStatus,
    isCheckingOnboarding,
    isHydrating,
    onboardingError,
    onboardingResolved,
    token,
  ]);

  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState !== 'active') {
        return;
      }

      // If account/session was deleted server-side while app was backgrounded,
      // revalidate and force local logout to prevent redirect loops.
      if (!token || !onboardingResolved || isCheckingOnboarding || Boolean(onboardingError)) {
        return;
      }

      const now = Date.now();
      if (now - lastOnboardingCheckAtRef.current < APP_STATE_RECHECK_COOLDOWN_MS) {
        return;
      }

      checkOnboardingStatus('appState');
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      subscription.remove();
    };
  }, [checkOnboardingStatus, isCheckingOnboarding, onboardingError, onboardingResolved, token]);

  useEffect(() => {
    if (isHydrating) {
      return;
    }

    const currentGroup = segments[0];
    const isOnLogin = currentGroup === 'login';
    const isOnAuthFallback = currentGroup === 'auth' || currentGroup === 'expo-auth-session';
    const isOnOnboarding = currentGroup === '(onboarding)';

    if (!token) {
      if (!isOnLogin && !isOnAuthFallback) {
        router.replace('/login');
      }
      return;
    }

    if (!onboardingResolved) {
      return;
    }

    if (needsOnboarding) {
      if (!isOnOnboarding) {
        router.replace('/(onboarding)/welcome');
      }
      return;
    }

    if (isOnLogin || isOnAuthFallback || isOnOnboarding) {
      router.replace('/(tabs)');
    }
  }, [isHydrating, needsOnboarding, onboardingResolved, segments, token]);

  if (isHydrating || (token && !onboardingResolved && !onboardingError)) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color="#00284D" />
        <Text style={styles.loadingText}>Validando sesion...</Text>
      </View>
    );
  }

  if (token && onboardingError) {
    return (
      <View style={styles.centeredContainer}>
        <Text style={styles.errorText}>{onboardingError}</Text>
        <Pressable
          style={({ pressed }) => [styles.retryButton, pressed && styles.retryButtonPressed]}
          onPress={() => {
            setOnboardingError(null);
            checkOnboardingStatus('retry');
          }}
          disabled={isCheckingOnboarding}
        >
          {isCheckingOnboarding ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.retryButtonText}>Reintentar</Text>
          )}
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.secondaryButton, pressed && styles.secondaryButtonPressed]}
          onPress={async () => {
            await clearSession();
            router.replace('/login');
          }}
          disabled={isCheckingOnboarding}
        >
          <Text style={styles.secondaryButtonText}>Cerrar sesion</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <AppErrorBoundary>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="login" />
        <Stack.Screen name="(onboarding)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="study-groups" />
        <Stack.Screen name="events/[id]" />
        <Stack.Screen name="auth/callback" />
        <Stack.Screen name="expo-auth-session" />
        <Stack.Screen name="profile" />
      </Stack>
      <GlobalSocketNotifications />
    </AppErrorBoundary>
  );
}

const styles = StyleSheet.create({
  centeredContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 12,
    backgroundColor: '#F7F9FB',
  },
  loadingText: {
    fontSize: 16,
    color: '#1F3D5D',
  },
  errorText: {
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'center',
    color: '#1F3D5D',
  },
  retryButton: {
    minWidth: 144,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#00284D',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  retryButtonPressed: {
    opacity: 0.75,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  secondaryButton: {
    minWidth: 144,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#00284D',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    backgroundColor: 'transparent',
  },
  secondaryButtonPressed: {
    opacity: 0.75,
  },
  secondaryButtonText: {
    color: '#00284D',
    fontSize: 15,
    fontWeight: '600',
  },
});