import { io, Socket } from "socket.io-client";
import { getChatServiceUrl } from "../../../config/api";
import type { WallPost } from "../types/wall.types";

class WallSocketService {
  private socket: Socket | null = null;
  private readonly url: string;

  constructor() {
    this.url = getChatServiceUrl();
  }

  connect(userId: string) {
    if (this.socket) {
      console.warn("[WallSocket] Socket ya está conectado.");
      return;
    }
    this.socket = io(this.url, {
      auth: { "x-user-id": userId },
      transports: ["websocket"],
    });
    this.socket.on("connect", () =>
      console.log("[WallSocket] Conectado al microservicio"),
    );
    this.socket.on("disconnect", () =>
      console.log("[WallSocket] Desconectado del microservicio"),
    );
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  joinWall(groupId: string) {
    if (this.socket) {
      this.socket.emit("wall:join", { groupId });
      console.log(`[WallSocket] Unido al muro del grupo ${groupId}`);
    }
  }

  leaveWall(groupId: string) {
    if (this.socket) {
      this.socket.emit("wall:leave", { groupId });
      console.log(`[WallSocket] Abandonado el muro del grupo ${groupId}`);
    }
  }

  onNewPost(callback: (post: WallPost) => void) {
    if (this.socket) {
      this.socket.on("wall:new_post", callback);
    }
  }

  offNewPost() {
    if (this.socket) {
      this.socket.off("wall:new_post");
    }
  }
}

export const wallSocket = new WallSocketService();
