import { MaterialIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuthStore } from '../../../store/authStore';
import {
    autosaveOnboardingContact,
    getOnboardingPrograms,
    OnboardingApiError,
    OnboardingStepOneValidationErrors,
    submitOnboardingStepOne,
    type OnboardingProgramOption,
} from '../services/onboardingService';
import { onboardingStepOneStyles as styles } from './onboardingStepOneStyles';

const SEMESTERS = Array.from({ length: 10 }, (_, index) => index + 1);

export function OnboardingStepOne() {
  const { token, clearSession } = useAuthStore();
  const params = useLocalSearchParams();

  const paramCareer = typeof params.career === 'string' ? params.career : '';
  const paramSemesterRaw = typeof params.semester === 'string' ? Number(params.semester) : NaN;
  const paramSemester = Number.isInteger(paramSemesterRaw) && paramSemesterRaw >= 1 && paramSemesterRaw <= 10
    ? paramSemesterRaw
    : null;
  const paramPhone = typeof params.phoneNumber === 'string' ? params.phoneNumber : '';

  const [career, setCareer] = useState(paramCareer);
  const [isCareerSelected, setIsCareerSelected] = useState(Boolean(paramCareer.trim()));
  const [semester, setSemester] = useState<number | null>(paramSemester);
  const [phoneNumber, setPhoneNumber] = useState(paramPhone);
  const [programOptions, setProgramOptions] = useState<OnboardingProgramOption[]>([]);
  const [showProgramsList, setShowProgramsList] = useState(false);
  const [showSemestersList, setShowSemestersList] = useState(false);
  const [loadingPrograms, setLoadingPrograms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<OnboardingStepOneValidationErrors>({});
  const [globalError, setGlobalError] = useState<string | null>(null);

  const lastSavedPhoneRef = useRef('');
  const careerInputRef = useRef<TextInput | null>(null);

  const normalizedCareer = useMemo(() => career.trim(), [career]);
  const normalizedPhone = useMemo(() => phoneNumber.trim(), [phoneNumber]);
  const phoneDigitsCount = useMemo(() => normalizedPhone.replace(/\D/g, '').length, [normalizedPhone]);

  useEffect(() => {
    if (!token) {
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setLoadingPrograms(true);
        const options = await getOnboardingPrograms(token, normalizedCareer, 20);
        setProgramOptions(options);
      } catch (error) {
        if (error instanceof OnboardingApiError && error.status === 401) {
          await clearSession();
          router.replace('/login');
          return;
        }

        setProgramOptions([]);
      } finally {
        setLoadingPrograms(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [clearSession, normalizedCareer, token]);

  useEffect(() => {
    if (!token || !normalizedPhone || normalizedPhone === lastSavedPhoneRef.current) {
      return;
    }

    const timer = setTimeout(async () => {
      try {
        await autosaveOnboardingContact(token, normalizedPhone);
        lastSavedPhoneRef.current = normalizedPhone;
      } catch {
        // Autosave errors are non-blocking; final validation runs on submit.
      }
    }, 700);

    return () => clearTimeout(timer);
  }, [normalizedPhone, token]);

  const mapValidationErrors = (validationErrors?: OnboardingStepOneValidationErrors) => {
    if (!validationErrors) {
      return;
    }

    setFormErrors({
      career: validationErrors.career,
      semester: validationErrors.semester,
      phone_number: validationErrors.phone_number,
    });
  };

  const handleContinue = async () => {
    if (!token) {
      router.replace('/login');
      return;
    }

    const nextErrors: OnboardingStepOneValidationErrors = {};

    if (!normalizedCareer) {
      nextErrors.career = 'Debes seleccionar tu carrera.';
    } else if (!isCareerSelected) {
      nextErrors.career = 'Debes elegir una carrera de la lista antes de continuar.';
    }

    if (!semester) {
      nextErrors.semester = 'Debes seleccionar tu semestre.';
    }

    if (!normalizedPhone) {
      nextErrors.phone_number = 'Debes ingresar un numero de contacto.';
    } else if (phoneDigitsCount < 10) {
      nextErrors.phone_number = 'El numero debe contener al menos 10 digitos.';
    }

    setFormErrors(nextErrors);
    setGlobalError(null);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    try {
      setIsSubmitting(true);
      await submitOnboardingStepOne(token, {
        career: normalizedCareer,
        semester: semester as number,
        phoneNumber: normalizedPhone,
      });

      router.replace({
        pathname: '/(onboarding)/subjects-update',
        params: {
          career: normalizedCareer,
          semester: String(semester),
          phoneNumber: normalizedPhone,
        },
      });
    } catch (error) {
      if (error instanceof OnboardingApiError) {
        if (error.status === 401) {
          await clearSession();
          router.replace('/login');
          return;
        }

        mapValidationErrors(error.validationErrors);
        setGlobalError(error.message);
        return;
      }

      setGlobalError('No fue posible guardar el paso 1. Intenta nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectCareer = (value: string) => {
    setCareer(value);
    setIsCareerSelected(true);
    setShowProgramsList(false);
    setFormErrors((prev) => ({ ...prev, career: undefined }));
    careerInputRef.current?.blur();
    Keyboard.dismiss();
  };

  const handleCareerChange = (value: string) => {
    setCareer(value);
    setIsCareerSelected(false);
    setShowProgramsList(true);
    setShowSemestersList(false);
    setFormErrors((prev) => ({ ...prev, career: undefined }));
  };

  const handleSelectSemester = (value: number) => {
    setSemester(value);
    setShowSemestersList(false);
    setFormErrors((prev) => ({ ...prev, semester: undefined }));
  };

  const handlePhoneChange = (value: string) => {
    const onlyNumbers = value.replace(/\D/g, '');
    const limitedNumbers = onlyNumbers.slice(0, 10);
    setPhoneNumber(limitedNumbers);
    setFormErrors((prev) => ({ ...prev, phone_number: undefined }));
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1 }}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>ACADEMICO Y PERSONAL</Text>
          </View>

          <ScrollView
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
            contentContainerStyle={{ flexGrow: 1 }}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.content}>
              <Text style={styles.stepText}>PASO 1 DE 2</Text>
              <View style={styles.dotsRow}>
                <View style={[styles.dot, styles.dotActive]} />
                <View style={[styles.dot, styles.dotInactive]} />
              </View>

              <Text style={styles.helperText}>
                Para comenzar, cuentanos un poco sobre tu situacion academica y personal.
              </Text>

              <View style={styles.formContainer}>
              <View style={styles.fieldContainer}>
              <View style={[styles.fieldBox, showProgramsList && styles.fieldBoxActive]}>
                <TextInput
                  ref={careerInputRef}
                  value={career}
                  onChangeText={handleCareerChange}
                  onFocus={() => {
                    setShowProgramsList(true);
                    setShowSemestersList(false);
                  }}
                  placeholder="Selecciona tu carrera (ej. Ingenieria de Sistemas)"
                  placeholderTextColor="#6B798F"
                  style={styles.input}
                  autoCorrect={false}
                  autoCapitalize="words"
                />
                <Pressable
                  onPress={() => {
                    setShowProgramsList((prev) => !prev);
                    setShowSemestersList(false);
                  }}
                  hitSlop={8}
                >
                  {loadingPrograms ? (
                    <ActivityIndicator size="small" color="#C8A04D" />
                  ) : (
                    <MaterialIcons name="keyboard-arrow-down" size={22} color="#C8A04D" />
                  )}
                </Pressable>
              </View>

              {showProgramsList && (
                <View style={styles.listContainer}>
                  {programOptions.length === 0 ? (
                    <Text style={styles.listEmpty}>No existen programas para la busqueda actual.</Text>
                  ) : (
                    <View>
                      {programOptions.map((item, index) => (
                        <TouchableOpacity
                          key={`${item.name}-${index}`}
                          onPress={() => handleSelectCareer(item.name)}
                          style={styles.listItem}
                        >
                          <Text style={styles.listItemText}>{item.name}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              )}

              {formErrors.career ? <Text style={styles.fieldError}>{formErrors.career}</Text> : null}
              </View>

              <View style={styles.fieldContainer}>
              <Pressable
                style={[styles.fieldBox, showSemestersList && styles.fieldBoxActive]}
                onPress={() => {
                  setShowSemestersList((prev) => !prev);
                  setShowProgramsList(false);
                }}
              >
                <Text
                  style={[
                    styles.selectText,
                    !semester ? styles.placeholderText : undefined,
                  ]}
                >
                  {semester ? String(semester) : 'Selecciona tu semestre (ej. 5)'}
                </Text>
                <MaterialIcons name="keyboard-arrow-down" size={22} color="#C8A04D" />
              </Pressable>

              {showSemestersList ? (
                <View style={styles.listContainer}>
                  <ScrollView
                    nestedScrollEnabled
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator
                  >
                    {SEMESTERS.map((item) => (
                      <TouchableOpacity
                        key={String(item)}
                        onPress={() => handleSelectSemester(item)}
                        style={styles.listItem}
                      >
                        <Text style={styles.listItemText}>{item}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              ) : null}

              {formErrors.semester ? <Text style={styles.fieldError}>{formErrors.semester}</Text> : null}
              </View>

                <View style={styles.fieldContainer}>
                  <View style={styles.fieldBox}>
                    <MaterialIcons name="phone" size={20} color="#C8A04D" />
                    <TextInput
                      value={phoneNumber}
                      onChangeText={handlePhoneChange}
                      onFocus={() => {
                        setShowProgramsList(false);
                        setShowSemestersList(false);
                      }}
                      placeholder="Ej. +57 300 123 4567"
                      placeholderTextColor="#6B798F"
                      style={styles.input}
                      keyboardType="phone-pad"
                      maxLength={10}
                      returnKeyType="done"
                      onSubmitEditing={Keyboard.dismiss}
                    />
                  </View>
                  {formErrors.phone_number ? (
                    <Text style={styles.fieldError}>{formErrors.phone_number}</Text>
                  ) : null}
                </View>

                {globalError ? <Text style={styles.globalError}>{globalError}</Text> : null}
              </View>

              <View style={styles.spacer} />

              <Pressable
                disabled={isSubmitting}
                onPress={handleContinue}
                style={({ pressed }) => [
                  styles.continueButton,
                  (pressed || isSubmitting) && styles.continueButtonPressed,
                ]}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.continueButtonText}>Continuar</Text>
                )}
              </Pressable>
            </View>
          </ScrollView>
        </SafeAreaView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}
