import { io, Socket } from 'socket.io-client';
import type { Poll, WallPost } from '../domain/wall';

const CHAT_SERVICE_URL =
  (import.meta.env.VITE_CHAT_SERVICE_URL as string | undefined)?.trim().replace(/\/+$/, '') ??
  'http://localhost:3004';

class WallSocketService {
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

  joinWall(groupId: string): void {
    this.socket?.emit('wall:join', { groupId });
  }

  leaveWall(groupId: string): void {
    this.socket?.emit('wall:leave', { groupId });
  }

  onNewPost(callback: (post: WallPost) => void): void {
    this.socket?.on('wall:new_post', callback);
  }

  offNewPost(): void {
    this.socket?.off('wall:new_post');
  }

  onPollCreated(callback: (post: WallPost) => void): void {
    this.socket?.on('encuesta:creada', callback);
  }

  offPollCreated(): void {
    this.socket?.off('encuesta:creada');
  }

  onPollVoteUpdated(callback: (poll: Poll) => void): void {
    this.socket?.on('encuesta:votoRegistrado', callback);
  }

  offPollVoteUpdated(): void {
    this.socket?.off('encuesta:votoRegistrado');
  }

  onPollClosed(callback: (poll: Poll) => void): void {
    this.socket?.on('encuesta:cerrada', callback);
  }

  offPollClosed(): void {
    this.socket?.off('encuesta:cerrada');
  }
}

export const wallSocket = new WallSocketService(CHAT_SERVICE_URL);
