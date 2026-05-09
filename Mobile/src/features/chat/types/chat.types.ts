export interface ChatPartner {
  id: string;
  name: string;
  avatarUrl?: string;
}

export interface Conversation {
  id: string;
  userA: string;
  userB: string;
  otherParticipant: ChatPartner;
  createdAt: string;
}

export interface ChatAttachment {
  id?: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  storagePath?: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  content?: string;
  attachments?: ChatAttachment[];
  createdAt: string;
}
