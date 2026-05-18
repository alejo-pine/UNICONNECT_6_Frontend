import { useAuthStore } from '@/src/store/authStore';
import { useCallback, useEffect, useState } from 'react';
import { eventsHttpService } from '../services/eventsHttpService';

export function useEventSubscription() {
  const { token } = useAuthStore();
  const [subscribedCategories, setSubscribedCategories] = useState<Set<string>>(new Set());
  const [loadingInit, setLoadingInit] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setSubscribedCategories(new Set());
      setLoadingInit(false);
      return;
    }

    let cancelled = false;
    const loadSubscriptions = async () => {
      setLoadingInit(true);
      const result = await eventsHttpService.getSubscriptions(token);
      if (!cancelled) {
        if (result.success && result.data) {
          setSubscribedCategories(new Set(result.data));
        }
        setLoadingInit(false);
      }
    };

    void loadSubscriptions();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const isSubscribed = useCallback(
    (category: string) => subscribedCategories.has(category),
    [subscribedCategories]
  );

  const subscribe = useCallback(async (category: string) => {
    if (!token) {
      setError('No session found');
      return false;
    }

    setIsSubmitting(true);
    setError(null);
    setSubscribedCategories((prev) => new Set(prev).add(category));

    const response = await eventsHttpService.subscribeToCategory(category, token);
    setIsSubmitting(false);

    if (response.success) {
      return true;
    } else {
      setSubscribedCategories((prev) => {
        const next = new Set(prev);
        next.delete(category);
        return next;
      });
      setError(response.error ?? 'Failed to subscribe to category');
      return false;
    }
  }, [token]);

  const unsubscribe = useCallback(async (category: string) => {
    if (!token) {
      setError('No session found');
      return false;
    }

    setIsSubmitting(true);
    setError(null);
    setSubscribedCategories((prev) => {
        const next = new Set(prev);
        next.delete(category);
        return next;
    });

    const response = await eventsHttpService.unsubscribeFromCategory(category, token);
    setIsSubmitting(false);

    if (response.success) {
      return true;
    } else {
      setSubscribedCategories((prev) => new Set(prev).add(category));
      setError(response.error ?? 'Failed to unsubscribe from category');
      return false;
    }
  }, [token]);

  return {
    subscribedCategories,
    loadingInit,
    isSubscribed,
    subscribe,
    unsubscribe,
    isSubmitting,
    error
  };
}

