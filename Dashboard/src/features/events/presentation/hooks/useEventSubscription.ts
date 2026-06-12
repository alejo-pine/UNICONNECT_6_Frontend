import { useState, useCallback, useEffect } from 'react';
import { useAuthStore } from '@shared/store/authStore';
import { eventsHttpService } from '../../infrastructure/eventsHttpService';

export type EventCategory = string;

interface UseEventSubscriptionReturn {
  subscribedCategories: Set<string>;
  loadingInit: boolean;
  loadingCategory: string | null;
  isSubscribed: (category: string) => boolean;
  toggleSubscription: (category: string) => Promise<void>;
  error: string | null;
}

export function useEventSubscription(): UseEventSubscriptionReturn {
  const token = useAuthStore((s) => s.token);
  const [subscribedCategories, setSubscribedCategories] = useState<Set<string>>(new Set());
  const [loadingInit, setLoadingInit] = useState(true);
  const [loadingCategory, setLoadingCategory] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load subscriptions from backend on mount (and whenever token changes)
  useEffect(() => {
    if (!token) {
      setSubscribedCategories(new Set());
      setLoadingInit(false);
      return;
    }

    let cancelled = false;

    const fetchSubscriptions = async () => {
      setLoadingInit(true);
      const result = await eventsHttpService.getSubscriptions(token);
      if (!cancelled) {
        if (result.success && result.data) {
          setSubscribedCategories(new Set(result.data));
        }
        setLoadingInit(false);
      }
    };

    void fetchSubscriptions();

    return () => {
      cancelled = true;
    };
  }, [token]);

  const isSubscribed = useCallback(
    (category: string) => subscribedCategories.has(category),
    [subscribedCategories]
  );

  const toggleSubscription = useCallback(
    async (category: string) => {
      if (!token || loadingCategory) return;
      setError(null);
      setLoadingCategory(category);

      const wasSubscribed = subscribedCategories.has(category);

      // Optimistic update
      setSubscribedCategories((prev) => {
        const next = new Set(prev);
        if (wasSubscribed) {
          next.delete(category);
        } else {
          next.add(category);
        }
        return next;
      });

      const result = wasSubscribed
        ? await eventsHttpService.unsubscribeCategory(category, token)
        : await eventsHttpService.subscribeCategory(category, token);

      if (!result.success) {
        // Revert on failure
        setSubscribedCategories((prev) => {
          const next = new Set(prev);
          if (wasSubscribed) {
            next.add(category);
          } else {
            next.delete(category);
          }
          return next;
        });
        setError(result.error ?? 'Error al actualizar la suscripción.');
      }

      setLoadingCategory(null);
    },
    [token, loadingCategory, subscribedCategories]
  );

  return { subscribedCategories, loadingInit, loadingCategory, isSubscribed, toggleSubscription, error };
}
