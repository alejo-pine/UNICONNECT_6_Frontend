import { useAuthStore } from '@/src/store/authStore';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import { useCallback } from 'react';

export default function ProfileLayout() {
  const { token } = useAuthStore();
  const router = useRouter();

  // 🛑 EL GUARDIÁN INTELIGENTE EN PERFIL
  // Solo se ejecuta si esta pantalla está ACTIVA y VISIBLE
  useFocusEffect(
    useCallback(() => {
      if (!token) {
        console.log('[ProfileLayout] Perfil activo sin token. Echando al usuario...');
        const timer = setTimeout(() => {
          router.replace('/login');
        }, 1);
        return () => clearTimeout(timer);
      }
    }, [token, router])
  );

  return (
    <Stack
      screenOptions={{
        headerShown: true,
      }}
    />
  );
}
