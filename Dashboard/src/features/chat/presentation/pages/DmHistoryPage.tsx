import { useCallback, useEffect, useRef } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useAuthStore } from '@shared/store/authStore';
import { Card } from '@shared/components/ui/Card';
import { dmSocket } from '../../infrastructure/dmSocketService';
import { DmMessageBubble } from '../components/DmMessageBubble';
import { DmMessageInput } from '../components/DmMessageInput';
import { useDmHistory } from '../hooks/useDmHistory';
import type { ChatPartner, DmMessage } from '../../domain/dm';

export function DmHistoryPage() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const navigate = useNavigate();
  const { state } = useLocation();
  const partner = state?.partner as ChatPartner | undefined;

  const userId = useAuthStore((s) => s.userId);

  const { messages, setMessages, loading, loadingMore, hasMore, error, loadMore } = useDmHistory(
    conversationId ?? '',
  );

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const prevScrollHeightRef = useRef<number>(0);
  const isLoadingMoreRef = useRef(false);

  useEffect(() => {
    if (!conversationId || !userId) return;

    dmSocket.connect(userId);
    dmSocket.joinConversation(conversationId);
    dmSocket.onNewMessage((msg: DmMessage) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    });

    return () => {
      dmSocket.offNewMessage();
      dmSocket.leaveConversation(conversationId);
      dmSocket.disconnect();
    };
  }, [conversationId, userId, setMessages]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    if (isLoadingMoreRef.current) {
      container.scrollTop = container.scrollHeight - prevScrollHeightRef.current;
      isLoadingMoreRef.current = false;
    } else {
      container.scrollTop = container.scrollHeight;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages]);

  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container || loadingMore || !hasMore) return;

    if (container.scrollTop <= 80) {
      prevScrollHeightRef.current = container.scrollHeight;
      isLoadingMoreRef.current = true;
      void loadMore();
    }
  }, [loadingMore, hasMore, loadMore]);

  const handleMessageSent = (msg: DmMessage) => {
    setMessages((prev) => {
      if (prev.some((m) => m.id === msg.id)) return prev;
      return [...prev, msg];
    });
  };

  const partnerName = partner?.name ?? 'Contacto';
  const partnerInitial = partnerName.charAt(0).toUpperCase();

  return (
    <div className="flex h-full flex-col gap-4">
      {/* Header */}
      <div className="flex flex-shrink-0 items-center gap-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="rounded-lg p-1 text-ink-500 hover:bg-ink-100"
        >
          <ArrowLeft size={20} />
        </button>

        <div className="flex h-9 w-9 flex-shrink-0 overflow-hidden rounded-full">
          {partner?.avatarUrl ? (
            <img
              src={partner.avatarUrl}
              alt={partnerName}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-brand-100 text-sm font-bold text-brand-900">
              {partnerInitial}
            </div>
          )}
        </div>

        <div>
          <h1 className="text-lg font-bold leading-tight text-ink-900">{partnerName}</h1>
          <p className="text-xs text-ink-400">Mensaje directo</p>
        </div>
      </div>

      {error ? (
        <Card className="text-sm font-medium text-red-600">{error}</Card>
      ) : loading ? (
        <div className="space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}
            >
              <div className="h-10 w-48 animate-pulse rounded-2xl bg-ink-100" />
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* Scrollable messages */}
          <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="min-h-0 flex-1 overflow-y-auto pr-1"
          >
            {loadingMore && (
              <div className="flex justify-center py-3">
                <Loader2 size={18} className="animate-spin text-ink-400" />
              </div>
            )}

            <div className="space-y-3 pb-2">
              {messages.length === 0 ? (
                <Card className="py-12 text-center text-sm text-ink-500">
                  Sé el primero en enviar un mensaje.
                </Card>
              ) : (
                messages.map((msg) => (
                  <DmMessageBubble
                    key={msg.id}
                    message={msg}
                    isOwn={msg.senderId === userId}
                  />
                ))
              )}
            </div>
          </div>

          {/* Input — pinned at bottom */}
          <div className="flex-shrink-0">
            {conversationId && (
              <DmMessageInput
                conversationId={conversationId}
                onMessageSent={handleMessageSent}
              />
            )}
          </div>
        </>
      )}
    </div>
  );
}
