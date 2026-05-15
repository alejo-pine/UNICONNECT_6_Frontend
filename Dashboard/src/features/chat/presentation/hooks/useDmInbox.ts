import { useCallback, useEffect, useState } from 'react';
import type { DmConversation } from '../../domain/dm';
import { dmHttpService } from '../../infrastructure/dmHttpService';

interface UseDmInboxReturn {
  conversations: DmConversation[];
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
}

export function useDmInbox(): UseDmInboxReturn {
  const [conversations, setConversations] = useState<DmConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);

    const result = await dmHttpService.getConversations();

    if (!result.success || !result.data) {
      setConversations([]);
      setError(result.error ?? 'No se pudo cargar la bandeja de mensajes directos');
    } else {
      setConversations(result.data);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { conversations, loading, error, reload };
}
