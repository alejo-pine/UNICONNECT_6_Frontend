import { io, Socket } from "socket.io-client";
import { getChatServiceUrl } from "../../../config/api";
import type { Poll, WallPost } from "../types/wall.types";

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

  onPollCreated(callback: (post: WallPost) => void) {
    this.socket?.on("encuesta:creada", callback);
  }

  offPollCreated() {
    this.socket?.off("encuesta:creada");
  }

  onPollVoteUpdated(callback: (poll: Poll) => void) {
    this.socket?.on("encuesta:votoRegistrado", callback);
  }

  offPollVoteUpdated() {
    this.socket?.off("encuesta:votoRegistrado");
  }

  onPollClosed(callback: (poll: Poll) => void) {
    this.socket?.on("encuesta:cerrada", callback);
  }

  offPollClosed() {
    this.socket?.off("encuesta:cerrada");
  }
}

export const wallSocket = new WallSocketService();
