import { ActivityIndicator, Text, View } from 'react-native';

export function AuthRedirectingView() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 }}>
      <ActivityIndicator />
      <Text>Completando inicio de sesion...</Text>
    </View>
  );
}
