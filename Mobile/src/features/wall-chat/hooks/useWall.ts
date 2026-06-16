import { useEffect } from "react";
import { useAuthStore } from "../../../store/authStore";
import { useWallStore } from "../../../store/wallStore";
import { wallSocket } from "../services/wallSocket";
import { normalizePoll, normalizePostPoll } from "../utils/pollNormalizer";

export const useWall = (groupId: string) => {
  const userId = useAuthStore((state) => state.userId);
  const {
    posts,
    loadingPosts,
    loadingMore,
    hasMorePosts,
    error,
    loadPosts,
    loadMorePosts,
    sendPost,
    receivePost,
    createPoll,
    uploadAndSendPost,
    clearPosts,
  } = useWallStore();

  useEffect(() => {
    if (!userId || !groupId) return;

    wallSocket.connect(userId);
    wallSocket.joinWall(groupId);

    wallSocket.onNewPost((post) => {
      useWallStore.getState().receivePost(normalizePostPoll(post));
    });

    // Encuesta creada → normalizar poll anidado antes de insertar
    wallSocket.onPollCreated((post) => {
      useWallStore.getState().receivePost(normalizePostPoll(post));
    });

    // Voto registrado → acceso directo al store para evitar closures stale.
    // Se usa mergePoll (no updatePoll) para preservar el votedByMe local:
    // userVotedOptionId del socket pertenece al votante, no al observador.
    wallSocket.onPollVoteUpdated((raw) => {
      const poll = normalizePoll(raw);
      if (poll) useWallStore.getState().mergePoll(poll);
    });

    // Encuesta cerrada → mismo tratamiento
    wallSocket.onPollClosed((raw) => {
      const poll = normalizePoll(raw);
      if (poll) useWallStore.getState().mergePoll(poll);
    });

    loadPosts(groupId);

    return () => {
      wallSocket.leaveWall(groupId);
      wallSocket.offNewPost();
      wallSocket.offPollCreated();
      wallSocket.offPollVoteUpdated();
      wallSocket.offPollClosed();
      wallSocket.disconnect();
      clearPosts();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId, userId]);

  return {
    posts,
    loadingPosts,
    loadingMore,
    hasMorePosts,
    error,
    loadMorePosts,
    sendPost,
    createPoll,
    uploadAndSendPost,
    userId,
  };
};
