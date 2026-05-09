import { router } from 'expo-router';
import { useEffect } from 'react';
import { AuthRedirectingView } from '../src/features/auth/components/AuthRedirectingView';

export default function ExpoAuthSessionFallbackScreen() {
  useEffect(() => {
    // Fallback route used by some AuthSession proxy redirects.
    router.replace('/');
  }, []);

  return <AuthRedirectingView />;
}
