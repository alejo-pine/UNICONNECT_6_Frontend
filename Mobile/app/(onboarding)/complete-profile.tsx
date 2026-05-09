import React from 'react';
import { OnboardingStepOne } from '../../src/features/onboarding/components/OnboardingStepOne';

/**
 * Pantalla para completar registro (primer acceso)
 * Se muestra después del login si needsCompleteProfile es true
 */
export default function CompleteProfileScreen() {
  return <OnboardingStepOne />;
}
