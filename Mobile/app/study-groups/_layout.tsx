/**
 * Layout para las rutas de grupos de estudio
 */

import { MaterialIcons } from '@expo/vector-icons';
import { Stack, router } from 'expo-router';
import React from 'react';
import { Pressable } from 'react-native';
import { NotificationBell } from '@/src/components/NotificationBell';

export default function StudyGroupsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: '#00284D' },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: { fontWeight: '600', fontSize: 17 },
        contentStyle: { backgroundColor: '#F8F9FA' },
        headerRight: () => <NotificationBell />,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Grupos',
          headerLeft: () => (
            <Pressable
              onPress={() => router.replace('/(tabs)')}
              style={{ paddingHorizontal: 12, paddingVertical: 2 }}
            >
              <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
            </Pressable>
          ),
        }}
      />
      <Stack.Screen name="create" options={{ title: 'Nuevo Grupo de Estudio' }} />
      <Stack.Screen name="[id]" options={{ title: 'Detalles del Grupo' }} />
      <Stack.Screen name="transfer-admin" options={{ title: 'Transferir Administración' }} />
    </Stack>
  );
}