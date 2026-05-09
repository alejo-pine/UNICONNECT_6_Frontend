import { useEffect } from "react";
import { useAuthStore } from "../../../store/authStore";
import { useWallStore } from "../../../store/wallStore";
import { wallSocket } from "../services/wallSocket";

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
    uploadAndSendPost,
    clearPosts,
  } = useWallStore();

  useEffect(() => {
    if (!userId || !groupId) return;

    wallSocket.connect(userId);
    wallSocket.joinWall(groupId);
    wallSocket.onNewPost((post) => receivePost(post));
    loadPosts(groupId);

    return () => {
      wallSocket.leaveWall(groupId);
      wallSocket.offNewPost();
      wallSocket.disconnect();
      clearPosts();
    };
  }, [groupId, userId]);

  return {
    posts,
    loadingPosts,
    loadingMore,
    hasMorePosts,
    error,
    loadMorePosts,
    sendPost,
    uploadAndSendPost,
    userId,
  };
};
