/**
 * Servicio de Perfil (Deprecated)
 * 
 * Este archivo se mantiene para compatibilidad hacia atrás.
 * Por favor usa profileHttpService.ts en su lugar.
 * 
 * Soluciona: God Service
 */
import { profileHttpService } from './profileHttpService';
import { ProfileData } from '../features/profile/types/profile';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export const profileService = {
  async getProfileById(id: string, token: string): Promise<ApiResponse<ProfileData>> {
    return profileHttpService.getProfileById(id, token);
  },

  async updateProfile(id: string, profileData: any, token: string): Promise<ApiResponse<any>> {
    return profileHttpService.updateProfile(id, profileData, token);
  },

  async updateProfileSubjects(id: string, subjectIds: string[], token: string): Promise<ApiResponse<any>> {
    return profileHttpService.updateProfileSubjects(id, subjectIds, token);
  },

  async uploadAvatar(id: string, uri: string, token: string): Promise<ApiResponse<{ url: string }>> {
    return profileHttpService.uploadAvatar(id, uri, token);
  },
};