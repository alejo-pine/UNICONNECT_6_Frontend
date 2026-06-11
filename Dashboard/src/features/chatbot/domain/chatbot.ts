export type MessageStatus = 'success' | 'timeout' | 'error' | 'role_not_supported';

export interface ChatReference {
  title: string;
  url: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  references?: ChatReference[];
  status?: MessageStatus;
  timestamp: number;
}

export interface Conversation {
  id: string;
  createdAt: string;
  lastMessage?: string;
}

export interface SendMessagePayload {
  message: string;
  conversationId?: string;
}

export interface SendMessageResponse {
  conversationId: string;
  reply: string;
  references?: ChatReference[];
  status: MessageStatus;
  error?: string;
}

export interface ApiConversation {
  id: string;
  createdAt: string;
  lastMessage?: string;
}

export interface ApiMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
  references?: ChatReference[];
}
