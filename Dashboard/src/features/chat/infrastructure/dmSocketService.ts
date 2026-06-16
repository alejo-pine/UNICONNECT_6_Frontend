import { io, Socket } from 'socket.io-client';
import type { DmMessage } from '../domain/dm';

const CHAT_SERVICE_URL =
  (import.meta.env.VITE_CHAT_SERVICE_URL as string | undefined)?.trim().replace(/\/+$/, '') ??
  'http://localhost:3004';

class DmSocketService {
  private socket: Socket | null = null;
  private readonly url: string;

  constructor(url: string) {
    this.url = url;
  }

  connect(userId: string): void {
    if (this.socket?.connected) return;
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.socket = io(this.url, {
      auth: { 'x-user-id': userId },
      transports: ['websocket'],
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  joinConversation(conversationId: string): void {
    this.socket?.emit('dm:join', { conversationId });
  }

  leaveConversation(conversationId: string): void {
    this.socket?.emit('dm:leave', { conversationId });
  }

  onNewMessage(callback: (message: DmMessage) => void): void {
    this.socket?.on('dm:new_message', callback);
  }

  offNewMessage(): void {
    this.socket?.off('dm:new_message');
  }
}

export const dmSocket = new DmSocketService(CHAT_SERVICE_URL);
