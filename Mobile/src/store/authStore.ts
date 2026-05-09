import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';

const AUTH_TOKEN_KEY = 'auth_token';
const AUTH_USER_ID_KEY = 'auth_user_id';
const ONBOARDING_DONE_KEY = 'onboarding_done';

interface AuthState {
  userId: string | null;
  token: string | null;
  profileRefreshKey: number;
  needsOnboarding: boolean | null;
  onboardingResolved: boolean;
  needsCompleteProfile: boolean;
  isSessionCleared: boolean;
  setUserId: (id: string) => void;
  setToken: (token: string) => void;
  setSession: (session: { userId: string; token: string; needsOnboarding: boolean }) => Promise<void>;
  setNeedsOnboarding: (value: boolean) => void;
  setOnboardingResolved: (value: boolean) => void;
  setNeedsCompleteProfile: (value: boolean) => void;
  markProfileAsComplete: () => void;
  triggerProfileRefresh: () => void;
  hydrateSession: () => Promise<void>;
  clearSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  userId: null,
  token: null,
  profileRefreshKey: 0,
  needsOnboarding: null,
  onboardingResolved: false,
  needsCompleteProfile: false,
  isSessionCleared: false,

  setUserId: (id: string) => {
    set({ userId: id });
  },

  setToken: (token: string) => {
    set({ token });
  },

  setSession: async ({ userId, token, needsOnboarding }) => {
    set({
      userId,
      token,
      needsOnboarding,
      onboardingResolved: true,
      isSessionCleared: false,
    });
    await SecureStore.setItemAsync(AUTH_USER_ID_KEY, userId);
    await SecureStore.setItemAsync(AUTH_TOKEN_KEY, token);
    if (!needsOnboarding) {
      await SecureStore.setItemAsync(ONBOARDING_DONE_KEY, 'true');
    }
  },

  setNeedsOnboarding: (value: boolean) => {
    set({ needsOnboarding: value });
    if (!value) {
      // Persist so subsequent cold starts skip the backend check
      SecureStore.setItemAsync(ONBOARDING_DONE_KEY, 'true').catch(() => {});
    }
  },

  setOnboardingResolved: (value: boolean) => {
    set({ onboardingResolved: value });
  },

  setNeedsCompleteProfile: (value: boolean) => {
    set({ needsCompleteProfile: value });
  },

  markProfileAsComplete: () => {
    set({ needsCompleteProfile: false });
  },

  triggerProfileRefresh: () => {
    set((state) => ({ profileRefreshKey: state.profileRefreshKey + 1 }));
  },

  hydrateSession: async () => {
    if (useAuthStore.getState().isSessionCleared) {
      console.log('[authStore] Rehidratacion omitida por cierre de sesion manual.');
      return;
    }

    let storedToken: string | null = null;
    let storedUserId: string | null = null;
    let onboardingDone: string | null = null;

    try {
      [storedToken, storedUserId, onboardingDone] = await Promise.all([
        SecureStore.getItemAsync(AUTH_TOKEN_KEY),
        SecureStore.getItemAsync(AUTH_USER_ID_KEY),
        SecureStore.getItemAsync(ONBOARDING_DONE_KEY),
      ]);
    } catch (error) {
      console.error('[authStore] Error leyendo SecureStore:', error);
      set({
        userId: null,
        token: null,
        needsOnboarding: null,
        onboardingResolved: false,
      });
      return;
    }

    if (storedToken && storedUserId) {
      const alreadyDone = onboardingDone === 'true';
      set({
        token: storedToken,
        userId: storedUserId,
        needsOnboarding: alreadyDone ? false : null,
        onboardingResolved: alreadyDone,
        isSessionCleared: false,
      });
      console.log(
        '[authStore] ✓ Sesion restaurada desde SecureStore',
        alreadyDone ? '(onboarding ya completado)' : '(onboarding pendiente de verificar)',
      );
      return;
    }

    console.log('[authStore] No existe sesion persistida. Usuario debe iniciar sesion.');
  },

  clearSession: async () => {
    await Promise.all([
      SecureStore.deleteItemAsync(AUTH_USER_ID_KEY),
      SecureStore.deleteItemAsync(AUTH_TOKEN_KEY),
      SecureStore.deleteItemAsync(ONBOARDING_DONE_KEY),
    ]);
    set({
      userId: null,
      token: null,
      profileRefreshKey: 0,
      needsOnboarding: null,
      onboardingResolved: false,
      needsCompleteProfile: false,
      isSessionCleared: true,
    });
    console.log('[authStore] Sesion limpiada.');
  },
}));
