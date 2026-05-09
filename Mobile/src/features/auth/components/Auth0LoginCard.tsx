import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/src/components/ThemedText';
import { useAuthLogin } from '@/src/features/auth/hooks/useAuthLogin';

type Auth0LoginCardProps = {
  onSyncSuccess?: (user: { auth0Id: string; email: string; name: string }) => void;
};

export function Auth0LoginCard({ onSyncSuccess }: Auth0LoginCardProps) {
  const { isLoading, errorMessage, canLogin, handleLogin } = useAuthLogin();

  const onPressLogin = async () => {
    const result = await handleLogin();
    if (result) {
      onSyncSuccess?.(result);
    }
  };

  return (
    <View style={styles.container}>
      <ThemedText type="title" style={styles.title}>
        Inicia sesión
      </ThemedText>
      <ThemedText style={styles.subtitle}>Usa tu correo institucional con Google/Auth0.</ThemedText>

      <Pressable
        onPress={onPressLogin}
        disabled={!canLogin}
        style={({ pressed }) => [
          styles.button,
          (pressed || isLoading || !canLogin) && styles.buttonPressed,
        ]}>
        {isLoading ? (
          <ActivityIndicator />
        ) : (
          <ThemedText type="defaultSemiBold">Continuar con Google</ThemedText>
        )}
      </Pressable>

      {errorMessage ? <ThemedText style={styles.error}>{errorMessage}</ThemedText> : null}

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    gap: 12,
    padding: 16,
  },
  title: {
    fontSize: 28,
    lineHeight: 32,
  },
  subtitle: {
    opacity: 0.8,
  },
  button: {
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPressed: {
    opacity: 0.7,
  },
  error: {
    fontSize: 14,
  },
});
