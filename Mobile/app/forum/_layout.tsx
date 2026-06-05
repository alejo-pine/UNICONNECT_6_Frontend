import { Stack } from 'expo-router';

export default function ForumLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#00284D' },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: { fontWeight: '600', fontSize: 17 },
      }}
    >
      <Stack.Screen
        name="index"
        options={{ title: 'Foros académicos' }}
      />
      <Stack.Screen
        name="[subjectId]"
        options={{ title: 'Foro de asignatura' }}
      />
      <Stack.Screen
        name="question"
        options={{ headerShown: false }}
      />
    </Stack>
  );
}
