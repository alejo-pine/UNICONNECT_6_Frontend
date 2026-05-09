import { useEffect } from "react";
import { chatSocket } from "../../../services/chatSocket";
import { useAuthStore } from "../../../store/authStore";
import { useChatStore } from "../../../store/chatStore";

export const useChat = (conversationId: string) => {
  const userId = useAuthStore((state) => state.userId);
  const {
    messages,
    loadingMessages,
    loadingMore,
    hasMoreMessages,
    error,
    loadMessages,
    loadMoreMessages,
    sendMessage,
    receiveMessage,
    uploadAndSendAttachment,
    clearMessages,
  } = useChatStore();

  useEffect(() => {
    if (!userId || !conversationId) return;

    chatSocket.connect(userId);
    chatSocket.joinConversation(conversationId);

    chatSocket.onNewMessage((msg) => {
      receiveMessage(msg);
    });

    loadMessages(conversationId);

    return () => {
      chatSocket.leaveConversation(conversationId);
      chatSocket.offNewMessage();
      chatSocket.disconnect();
      clearMessages();
    };
  }, [conversationId, userId]);

  return {
    messages,
    loadingMessages,
    loadingMore,
    hasMoreMessages,
    error,
    loadMoreMessages,
    sendMessage,
    uploadAndSendAttachment,
    userId,
  };
};
