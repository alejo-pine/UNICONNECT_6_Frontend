import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuthStore } from '@shared/store/authStore';
import { eventsHttpService } from '../../infrastructure/eventsHttpService';
import type { EventCardSummary } from '../../domain/events';

export function useEventsFeed(limit = 10) {
  const token = useAuthStore((s) => s.token);

  const [events, setEvents] = useState<EventCardSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // States for pagination, search, and filters
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [categories, setCategories] = useState<string[]>([]);

  const hasEvents = useMemo(() => events.length > 0, [events.length]);

  // Handle debounce
  useEffect(() => {
    const handler = setTimeout(() => {
      if (search.length === 0 || search.length >= 3) {
        setDebouncedSearch(search);
        setPage(1); // Reset page on new search
      }
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  // Load data
  const load = useCallback(async () => {
    if (!token) {
      setEvents([]);
      setError('No se encontró sesión activa para consultar eventos.');
      setLoading(false);
      return;
    }
    setLoading(true);
    
    const validSearch = debouncedSearch.length >= 3 ? debouncedSearch : undefined;

    const result = await eventsHttpService.getEvents(token, {
      limit,
      page,
      search: validSearch,
      categories,
    });

    if (result.success && result.data) {
      setEvents(result.data.data);
      setTotal(result.data.total);
      setError(null);
    } else {
      setEvents([]);
      setTotal(0);
      setError(result.error ?? 'No se pudieron cargar los eventos.');
    }
    setLoading(false);
  }, [token, limit, page, debouncedSearch, categories]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleCategoryToggle = (category: string) => {
    setCategories((prev) => {
      const newCats = prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category];
      setPage(1); // Reset page on filter change
      return newCats;
    });
  };

  return { 
    events, 
    total,
    loading, 
    error, 
    hasEvents, 
    page,
    setPage,
    search,
    setSearch,
    categories,
    handleCategoryToggle,
    reload: load 
  };
}
