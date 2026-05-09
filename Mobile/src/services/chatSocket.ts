import { io, Socket } from "socket.io-client";
import { getChatServiceUrl } from "../config/api";
import { ChatMessage } from "../features/chat/types/chat.types";

class ChatSocketService {
  private socket: Socket | null = null;
  private url: string;

  constructor() {
    this.url = getChatServiceUrl();
  }

  connect(userId: string) {
    if (this.socket) {
      console.warn("[ChatSocket] Socket ya está conectado.");
      return;
    }

    this.socket = io(this.url, {
      auth: { "x-user-id": userId },
      transports: ["websocket"],
    });

    this.socket.on("connect", () => {
      console.log("[ChatSocket] Conectado al microservicio");
    });

    this.socket.on("disconnect", () => {
      console.log("[ChatSocket] Desconectado del microservicio");
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  joinConversation(conversationId: string) {
    if (this.socket) {
      this.socket.emit("join-conversation", conversationId);
      console.log(`[ChatSocket] Unido a la conversación ${conversationId}`);
    }
  }

  leaveConversation(conversationId: string) {
    if (this.socket) {
      this.socket.emit("leave-conversation", conversationId);
      console.log(`[ChatSocket] Abandonada la conversación ${conversationId}`);
    }
  }

  onNewMessage(callback: (msg: ChatMessage) => void) {
    if (this.socket) {
      this.socket.on("dm:new_message", callback);
    }
  }

  offNewMessage() {
    if (this.socket) {
      this.socket.off("dm:new_message");
    }
  }
}

export const chatSocket = new ChatSocketService();
