import { router } from 'expo-router';
import { useEffect } from 'react';
import { AuthRedirectingView } from '../../src/features/auth/components/AuthRedirectingView';

export default function AuthCallbackScreen() {
  useEffect(() => {
    // If the app opens this route from the OAuth redirect, send user back
    // to the login entry and let AuthSession finish resolving in memory.
    router.replace('/');
  }, []);

  return <AuthRedirectingView />;
}
