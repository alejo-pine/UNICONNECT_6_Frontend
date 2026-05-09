/**
 * Servicio HTTP para la feature de búsqueda de compañeros (US-005).
 * Separa las llamadas al backend de la lógica de la UI.
 */
import { API_BASE_URL } from "../../../config/api";
import { parseError } from "../../../utils/errorHandler";
import type { Classmate, SearchSubject } from "../types/search";

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

const getApiOrigin = (): string => {
  const trimmed = API_BASE_URL.replace(/\/+$/, "");
  return trimmed.endsWith("/api") ? trimmed.slice(0, -4) : trimmed;
};

const normalizeAvatarUrl = (value: unknown): string | null => {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }

  if (trimmed.startsWith("//")) {
    return `https:${trimmed}`;
  }

  const origin = getApiOrigin();
  if (trimmed.startsWith("/")) {
    return `${origin}${trimmed}`;
  }

  return `${origin}/${trimmed}`;
};

const normalizeClassmates = (items: Classmate[]): Classmate[] =>
  items.map((item) => ({
    ...item,
    avatar_url: normalizeAvatarUrl(item.avatar_url),
  }));

console.log("[searchHttpService] Base URL configurada:", API_BASE_URL);

export const searchHttpService = {
  /**
   * GET /api/subjects?profile_id=:profileId
   * Devuelve las materias inscritas del perfil autenticado.
   */
  async getSubjectsByProfile(
    profileId: string,
    token: string,
  ): Promise<ApiResponse<SearchSubject[]>> {
    try {
      const url = `${API_BASE_URL}/profile-subjects/${profileId}`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
        },
      });

      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.error || `Error ${response.status}`);
      }

      return { success: true, data: json.data ?? json };
    } catch (error) {
      const appError = parseError(error);
      console.error(
        "[searchHttpService] getSubjectsByProfile error:",
        appError.message,
      );
      return { success: false, error: appError.message };
    }
  },

  /**
   * GET /api/students/classmates/:subjectId
   * Devuelve la lista de compañeros inscritos en la materia.
   */
  async getClassmatesBySubject(
    subjectId: string,
    token: string,
  ): Promise<ApiResponse<Classmate[]>> {
    try {
      const url = `${API_BASE_URL}/students/classmates/${subjectId}`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.error || `Error ${response.status}`);
      }

      const classmates = (json.data ?? json) as Classmate[];
      return { success: true, data: normalizeClassmates(classmates) };
    } catch (error) {
      const appError = parseError(error);
      console.error(
        "[searchHttpService] getClassmatesBySubject error:",
        appError.message,
      );
      return { success: false, error: appError.message };
    }
  },
};
