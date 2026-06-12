import { useState, useCallback, useEffect } from 'react';
import { useAuthStore } from '@shared/store/authStore';
import { categoryApiService } from '../../infrastructure/categoryApiService';
import type { Category } from '../../../events/domain/Category';

export function useAdminCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const token = useAuthStore((state) => state.token);

  const fetchCategories = useCallback(async () => {
    if (!token) return;
    
    setIsLoading(true);
    setError(null);
    
    const response = await categoryApiService.getCategories(token);
    
    if (response.success && response.data) {
      setCategories(response.data);
    } else {
      setError(response.error || 'Error al cargar categorías');
    }
    
    setIsLoading(false);
  }, [token]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const createCategory = async (payload: { name: string; description?: string }) => {
    if (!token) return { success: false, error: 'No autorizado' };
    
    const response = await categoryApiService.createCategory(token, payload);
    if (response.success && response.data) {
      // Optimistic update or refresh
      setCategories(prev => [...prev, response.data!].sort((a, b) => a.name.localeCompare(b.name)));
    }
    return response;
  };

  const updateCategory = async (id: string, payload: { name: string; description?: string }) => {
    if (!token) return { success: false, error: 'No autorizado' };
    
    const response = await categoryApiService.updateCategory(token, id, payload);
    if (response.success && response.data) {
      setCategories(prev => {
        const updated = prev.map(c => c.id === id ? response.data! : c);
        return updated.sort((a, b) => a.name.localeCompare(b.name));
      });
    }
    return response;
  };

  const deleteCategory = async (id: string) => {
    if (!token) return { success: false, error: 'No autorizado' };
    
    const response = await categoryApiService.deleteCategory(token, id);
    if (response.success) {
      setCategories(prev => prev.filter(c => c.id !== id));
    }
    return response;
  };

  return {
    categories,
    isLoading,
    error,
    refreshCategories: fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory
  };
}
