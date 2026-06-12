import { useState, useEffect } from 'react';
import { useAuthStore } from '@shared/store/authStore';
import { categoryApiService } from '../../../../features/admin/infrastructure/categoryApiService';
import type { Category } from '../../domain/Category';

export function useCategories() {
  const token = useAuthStore((s) => s.token);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  useEffect(() => {
    if (!token) {
      setCategories([]);
      setLoadingCategories(false);
      return;
    }

    let isMounted = true;
    const fetchCategories = async () => {
      setLoadingCategories(true);
      const res = await categoryApiService.getCategories(token);
      if (isMounted) {
        if (res.success && res.data) {
          setCategories(res.data);
        }
        setLoadingCategories(false);
      }
    };

    void fetchCategories();

    return () => {
      isMounted = false;
    };
  }, [token]);

  return { categories, loadingCategories };
}
