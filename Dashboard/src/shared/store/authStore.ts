import { create } from 'zustand';

interface AuthState {
  userId: string | null;
  token: string | null;
  needsOnboarding: boolean;
  isHydrating: boolean;
  role: string | null;
  setSession: (session: { userId: string; token: string | null; needsOnboarding?: boolean; role?: string }) => void;
  setHydrated: () => void;
  clearSession: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  userId: null,
  token: null,
  needsOnboarding: false,
  isHydrating: true,
  role: null,

  setSession: ({ userId, token, needsOnboarding = false, role = 'user' }) => {
    set({ userId, token, needsOnboarding, role, isHydrating: false });
  },

  setHydrated: () => {
    set({ isHydrating: false });
  },

  clearSession: () => {
    set({ userId: null, token: null, needsOnboarding: false, role: null, isHydrating: false });
  },
}));
