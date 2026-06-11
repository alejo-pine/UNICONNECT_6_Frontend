import { create } from 'zustand';
import type { ChatMessage, Conversation } from '../domain/chatbot';

interface ChatbotStore {
  isOpen: boolean;
  activeView: 'chat' | 'conversations';
  conversationId: string | null;
  messages: ChatMessage[];
  conversations: Conversation[];
  isSending: boolean;

  toggle: () => void;
  close: () => void;
  setView: (v: 'chat' | 'conversations') => void;
  setConversationId: (id: string | null) => void;
  addMessage: (msg: ChatMessage) => void;
  setMessages: (msgs: ChatMessage[]) => void;
  setConversations: (convs: Conversation[]) => void;
  setSending: (v: boolean) => void;
  startNewConversation: () => void;
}

export const useChatbotStore = create<ChatbotStore>((set) => ({
  isOpen: false,
  activeView: 'chat',
  conversationId: null,
  messages: [],
  conversations: [],
  isSending: false,

  toggle: () => set((s) => ({ isOpen: !s.isOpen })),
  close: () => set({ isOpen: false }),
  setView: (v) => set({ activeView: v }),
  setConversationId: (id) => set({ conversationId: id }),
  addMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),
  setMessages: (msgs) => set({ messages: msgs }),
  setConversations: (convs) => set({ conversations: convs }),
  setSending: (v) => set({ isSending: v }),
  startNewConversation: () => set({ conversationId: null, messages: [], activeView: 'chat' }),
}));
