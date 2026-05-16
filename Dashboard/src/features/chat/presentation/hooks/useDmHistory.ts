import { useCallback, useEffect, useRef, useState } from 'react';
import type React from 'react';
import type { DmMessage } from '../../domain/dm';
import { dmHttpService } from '../../infrastructure/dmHttpService';

const PAGE_SIZE = 20;

const sortChronological = (msgs: DmMessage[]): DmMessage[] =>
  [...msgs].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

interface UseDmHistoryReturn {
  messages: DmMessage[];
  setMessages: React.Dispatch<React.SetStateAction<DmMessage[]>>;
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  error: string | null;
  loadMore: () => Promise<void>;
}

export function useDmHistory(conversationId: string): UseDmHistoryReturn {
  const [messages, setMessages] = useState<DmMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const oldestIdRef = useRef<string | undefined>(undefined);

  const load = useCallback(async () => {
    if (!conversationId) return;
    setLoading(true);
    setError(null);
    oldestIdRef.current = undefined;

    const result = await dmHttpService.getMessages(conversationId, { limit: PAGE_SIZE });

    if (!result.success || !result.data) {
      setMessages([]);
      setError(result.error ?? 'No se pudo cargar el historial de mensajes');
    } else {
      const sorted = sortChronological(result.data);
      setMessages(sorted);
      setHasMore(result.data.length === PAGE_SIZE);
      oldestIdRef.current = sorted[0]?.id;
    }

    setLoading(false);
  }, [conversationId]);

  useEffect(() => {
    void load();
  }, [load]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || !oldestIdRef.current) return;

    setLoadingMore(true);

    const result = await dmHttpService.getMessages(conversationId, {
      limit: PAGE_SIZE,
      before: oldestIdRef.current,
    });

    if (result.success && result.data && result.data.length > 0) {
      const olderSorted = sortChronological(result.data);
      setMessages((prev) => [...olderSorted, ...prev]);
      setHasMore(olderSorted.length === PAGE_SIZE);
      oldestIdRef.current = olderSorted[0]?.id ?? oldestIdRef.current;
    } else {
      setHasMore(false);
    }

    setLoadingMore(false);
  }, [conversationId, loadingMore, hasMore]);

  return { messages, setMessages, loading, loadingMore, hasMore, error, loadMore };
}
