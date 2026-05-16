import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useAuthStore } from '@shared/store/authStore';
import { Card } from '@shared/components/ui/Card';
import { wallSocket } from '../../infrastructure/wallSocketService';
import { normalizeWallPost } from '../../infrastructure/wallHttpService';
import { dmHttpService } from '../../infrastructure/dmHttpService';
import { WallPostWithAttachments } from '../components/WallPostWithAttachments';
import { WallPostInput } from '../components/WallPostInput';
import { useWallHistory } from '../hooks/useWallHistory';
import type { ChatPartner } from '../../domain/dm';

export function WallHistoryPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const { state } = useLocation();
  const groupName = (state?.groupName as string | undefined) ?? 'Grupo';
  const groupInitial = groupName.charAt(0).toUpperCase();
  const userId = useAuthStore((state) => state.userId);

  const { posts, setPosts, loading, loadingMore, hasMore, error, loadMore } = useWallHistory(
    groupId ?? '',
  );

  const [selectedSender, setSelectedSender] = useState<ChatPartner | null>(null);
  const [dmLoading, setDmLoading] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const prevScrollHeightRef = useRef<number>(0);
  const isLoadingMoreRef = useRef(false);

  // Socket lifecycle
  useEffect(() => {
    if (!groupId || !userId) return;

    wallSocket.connect(userId);
    wallSocket.joinWall(groupId);
    wallSocket.onNewPost((post) => {
      setPosts((prev) => [...prev, normalizeWallPost(post)]);
    });

    return () => {
      wallSocket.offNewPost();
      wallSocket.leaveWall(groupId);
      wallSocket.disconnect();
    };
  }, [groupId, userId, setPosts]);

  // Scroll management: bottom on new post, position restore on load more
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
  }, [posts]);

  // Infinite scroll: trigger loadMore when user scrolls near the top
  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container || loadingMore || !hasMore) return;

    if (container.scrollTop <= 80) {
      prevScrollHeightRef.current = container.scrollHeight;
      isLoadingMoreRef.current = true;
      void loadMore();
    }
  }, [loadingMore, hasMore, loadMore]);

  const handleSenderClick = (senderId: string, senderName: string, avatarUrl?: string) => {
    setSelectedSender({ id: senderId, name: senderName, avatarUrl });
  };

  const handleStartDm = async () => {
    if (!selectedSender) return;
    setDmLoading(true);
    const result = await dmHttpService.getOrCreateConversation(selectedSender.id);
    setDmLoading(false);
    if (result.success && result.data) {
      const partner: ChatPartner = selectedSender;
      setSelectedSender(null);
      navigate(`/chat/dm/${result.data.id}`, { state: { partner } });
    }
  };

  return (
    <div className="flex h-full flex-col gap-4">
      {/* Header — always visible */}
      <div className="flex flex-shrink-0 items-center gap-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="rounded-lg p-1 text-ink-500 hover:bg-ink-100"
        >
          <ArrowLeft size={20} />
        </button>

        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-100 text-sm font-bold text-brand-900">
          {groupInitial}
        </div>

        <div>
          <h1 className="text-lg font-bold leading-tight text-ink-900">{groupName}</h1>
          <p className="text-xs text-ink-400">Muro del grupo</p>
        </div>
      </div>

      {error ? (
        <Card className="text-sm font-medium text-red-600">{error}</Card>
      ) : loading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-3">
              <div className="h-9 w-9 animate-pulse rounded-full bg-ink-100" />
              <div className="flex-1 space-y-2 pt-1">
                <div className="h-3.5 w-1/3 animate-pulse rounded bg-ink-100" />
                <div className="h-3 w-2/3 animate-pulse rounded bg-ink-100" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* Scrollable messages — fills remaining space */}
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

            <div className="space-y-6 pb-2">
              {posts.length === 0 ? (
                <Card className="py-12 text-center text-sm text-ink-500">
                  Sé el primero en publicar en este grupo.
                </Card>
              ) : (
                posts.map((post) => (
                  <WallPostWithAttachments
                    key={post.id}
                    post={post}
                    currentUserId={userId ?? undefined}
                    onSenderClick={handleSenderClick}
                  />
                ))
              )}
            </div>
          </div>

          {/* Input — always pinned at bottom */}
          <div className="flex-shrink-0">
            {groupId && <WallPostInput groupId={groupId} />}
          </div>
        </>
      )}

      {selectedSender && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
          onClick={() => setSelectedSender(null)}
        >
          <div
            className="w-64 rounded-xl bg-white p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center gap-3">
              <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-full">
                {selectedSender.avatarUrl ? (
                  <img
                    src={selectedSender.avatarUrl}
                    alt={selectedSender.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-brand-100 text-sm font-bold text-brand-900">
                    {selectedSender.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <p className="font-semibold text-ink-900">{selectedSender.name}</p>
            </div>
            <button
              type="button"
              onClick={() => void handleStartDm()}
              disabled={dmLoading}
              className="w-full rounded-lg bg-[#00284D] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#003a6b] disabled:opacity-60"
            >
              {dmLoading ? 'Abriendo...' : 'Mensaje privado'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
