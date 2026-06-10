import { useAuthStore } from '@/src/store/authStore';
import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState, useEffect } from 'react';

import { eventsHttpService } from '../services/eventsHttpService';
import type { EventCardSummary } from '../types/events';

export function useEventsFeed(limit = 10) {
  const { token } = useAuthStore();

  const [events, setEvents] = useState<EventCardSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [categories, setCategories] = useState<string[]>([]);

  const hasEvents = useMemo(() => events.length > 0, [events.length]);

  // Debounce para la búsqueda
  useEffect(() => {
    const handler = setTimeout(() => {
      if (search.length === 0 || search.length >= 3) {
        setDebouncedSearch(search);
        setPage(1);
      }
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  const handleCategoryToggle = useCallback((category: string) => {
    setCategories((prev) => {
      const isSelected = prev.includes(category);
      const newCategories = isSelected
        ? prev.filter((c) => c !== category)
        : [...prev, category];
      setPage(1);
      return newCategories;
    });
  }, []);

  const loadEvents = useCallback(
    async (refresh = false, isActive?: () => boolean) => {
      if (!token) {
        if (!isActive || isActive()) {
          setEvents([]);
          setError('No se encontró sesión activa para consultar eventos.');
          setIsLoading(false);
          setIsRefreshing(false);
        }
        return;
      }

      if (!isActive || isActive()) {
        if (refresh) {
          setIsRefreshing(true);
        } else {
          setIsLoading(true);
        }
      }

      const validSearch = debouncedSearch.length >= 3 ? debouncedSearch : undefined;

      const response = await eventsHttpService.getEvents(token, {
        limit,
        page,
        search: validSearch,
        categories,
      });

      if (!isActive || isActive()) {
        if (response.success && response.data) {
          setEvents(response.data.data);
          setTotal(response.data.total);
          setError(null);
        } else {
          setEvents([]);
          setTotal(0);
          setError(response.error ?? 'No se pudieron cargar los eventos.');
        }

        if (refresh) {
          setIsRefreshing(false);
        } else {
          setIsLoading(false);
        }
      }
    },
    [limit, page, debouncedSearch, categories, token]
  );

  useFocusEffect(
    useCallback(() => {
      let active = true;
      const isActive = () => active;

      loadEvents(false, isActive);

      return () => {
        active = false;
      };
    }, [loadEvents])
  );

  return {
    events,
    total,
    isLoading,
    isRefreshing,
    error,
    hasEvents,
    page,
    setPage,
    search,
    setSearch,
    categories,
    handleCategoryToggle,
    refreshEvents: () => loadEvents(true),
  };
}
