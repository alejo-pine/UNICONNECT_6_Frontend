import { useCallback, useEffect, useState } from 'react';
import { ProfileData } from '../types/profile';
import { useProfileSave } from './useProfileSave';

interface UseProfileFormReturn {
  profile: ProfileData;
  loading: boolean;
  error: string | null;
  updateSemester: (semester: number) => void;
  updateAvatar: (uri: string) => void;
  updatePhone: (phone: string) => void;
  addSubject: (name: string) => void;
  removeSubject: (id: string) => void;
  saveProfile: () => Promise<boolean>;
  clearError: () => void;
}

export const useProfileForm = (
  initialData?: ProfileData
): UseProfileFormReturn => {
  const [profile, setProfile] = useState<ProfileData>(
    initialData || {
      id: '',
      name: '',
      email: '',
      career: null,
      semester: null,
      materias: [],
      phone_number: null,
      avatar_url: null,
    }
  );

  const { saving, error: saveError, saveProfile: performSave, clearError } =
    useProfileSave();

  useEffect(() => {
    if (!initialData) {
      return;
    }

    setProfile({
      ...initialData,
      materias: initialData.materias || [],
    });
  }, [initialData]);

  const updateSemester = useCallback((semester: number) => {
    setProfile((prev) => ({ ...prev, semester }));
  }, []);

  const updatePhone = useCallback((phone: string) => {
    setProfile((prev) => ({ ...prev, phone_number: phone }));
  }, []);

  const updateAvatar = useCallback((uri: string) => {
    setProfile((prev) => ({ ...prev, avatar_url: uri }));
  }, []);

  const addSubject = useCallback((name: string) => {
    const trimmedName = name.trim();
    if (!trimmedName) return;

    setProfile((prev) => {
      const materias = Array.isArray(prev.materias) ? prev.materias : [];
      return {
        ...prev,
        materias: [...materias, { id: String(Date.now()), name: trimmedName }],
      };
    });
  }, []);

  const removeSubject = useCallback((id: string) => {
    setProfile((prev) => ({
      ...prev,
      materias: prev.materias.filter((s) => s.id !== id),
    }));
  }, []);

  const saveProfile = useCallback(async (): Promise<boolean> => {
    return performSave(profile);
  }, [profile, performSave]);

  return {
    profile,
    loading: saving,
    error: saveError,
    updatePhone,
    updateSemester,
    updateAvatar,
    addSubject,
    removeSubject,
    saveProfile,
    clearError,
  };
};
