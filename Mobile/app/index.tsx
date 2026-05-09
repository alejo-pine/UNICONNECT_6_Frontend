import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useAuthStore } from '../src/store/authStore';

export default function Index() {
  const { token, onboardingResolved, needsOnboarding } = useAuthStore();

  if (!token) {
    return <Redirect href="/login" />;
  }

  if (!onboardingResolved) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#00284D" />
      </View>
    );
  }

  if (needsOnboarding) {
    return <Redirect href="/(onboarding)/welcome" />;
  }

  return <Redirect href="/(tabs)" />;
}
