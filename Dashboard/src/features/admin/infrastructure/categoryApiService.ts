import { API_BASE_URL } from '@shared/services/api/apiClient';
import type { Category } from '../../events/domain/Category';
import type { ApiResponse } from '../../events/domain/events';

const CATEGORIES_ENDPOINT = `${API_BASE_URL}/events/categories`;

const readJson = async (response: Response): Promise<unknown> => {
  try {
    return await response.json();
  } catch {
    return null;
  }
};

const getErrorMessage = (payload: unknown, status: number): string => {
  if (payload && typeof payload === 'object') {
    const obj = payload as Record<string, unknown>;
    if (typeof obj.error === 'string' && obj.error.trim()) return obj.error;
    if (typeof obj.message === 'string' && obj.message.trim()) return obj.message;
  }
  return `Error ${status}`;
};

const authHeaders = (token: string) => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${token}`,
});

export const categoryApiService = {
  async getCategories(token: string): Promise<ApiResponse<Category[]>> {
    try {
      const response = await fetch(CATEGORIES_ENDPOINT, {
        headers: authHeaders(token),
      });
      const payload = await readJson(response);
      
      if (!response.ok) {
        return { success: false, error: getErrorMessage(payload, response.status) };
      }

      const data = payload && typeof payload === 'object' && 'data' in payload 
        ? (payload as any).data 
        : [];

      return { success: true, data };
    } catch {
      return { success: false, error: 'Error de conexión. Verifica tu conexión a internet.' };
    }
  },

  async createCategory(
    token: string, 
    payload: { name: string; description?: string }
  ): Promise<ApiResponse<Category>> {
    try {
      const response = await fetch(CATEGORIES_ENDPOINT, {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify(payload),
      });
      const data = await readJson(response);
      
      if (!response.ok) {
        return { success: false, error: getErrorMessage(data, response.status) };
      }

      const result = data && typeof data === 'object' && 'data' in data
        ? (data as { data: Category }).data
        : undefined;

      return { success: true, data: result };
    } catch {
      return { success: false, error: 'Error de conexión al crear la categoría.' };
    }
  },

  async updateCategory(
    token: string, 
    id: string, 
    payload: { name: string; description?: string }
  ): Promise<ApiResponse<Category>> {
    try {
      const response = await fetch(`${CATEGORIES_ENDPOINT}/${id}`, {
        method: 'PUT',
        headers: authHeaders(token),
        body: JSON.stringify(payload),
      });
      const data = await readJson(response);
      
      if (!response.ok) {
        return { success: false, error: getErrorMessage(data, response.status) };
      }

      const result = data && typeof data === 'object' && 'data' in data
        ? (data as { data: Category }).data
        : undefined;

      return { success: true, data: result };
    } catch {
      return { success: false, error: 'Error de conexión al actualizar la categoría.' };
    }
  },

  async deleteCategory(token: string, id: string): Promise<ApiResponse<void>> {
    try {
      const response = await fetch(`${CATEGORIES_ENDPOINT}/${id}`, {
        method: 'DELETE',
        headers: authHeaders(token),
      });
      
      if (response.status === 204) {
        return { success: true };
      }

      const data = await readJson(response);
      if (!response.ok) {
        return { success: false, error: getErrorMessage(data, response.status) };
      }
      
      return { success: true };
    } catch {
      return { success: false, error: 'Error de conexión al eliminar la categoría.' };
    }
  }
};
