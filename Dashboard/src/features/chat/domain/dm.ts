import type { ChatApiResponse } from './wall';

export type { ChatApiResponse };

export interface DmAttachment {
  id?: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  storagePath: string;
}

export interface DmMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName?: string;
  avatarUrl?: string;
  content?: string;
  attachments?: DmAttachment[];
  createdAt: string;
}

export interface ChatPartner {
  id: string;
  name: string;
  avatarUrl?: string;
}

export interface DmConversation {
  id: string;
  otherParticipant: ChatPartner;
  lastMessage?: DmMessage;
  createdAt: string;
}

export type { PendingAttachment as PendingDmAttachment } from './wall';
