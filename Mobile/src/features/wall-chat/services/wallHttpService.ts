import chatApi from "../../../services/chatApi";
import type { WallInboxEntry, WallPost, WallPostAttachment } from "../types/wall.types";

export const wallHttpService = {
  async getPosts(groupId: string, limit = 20, before?: string): Promise<WallPost[]> {
    const params = new URLSearchParams({ limit: String(limit) });
    if (before) params.append("before", before);
    const response = await chatApi.get<WallPost[]>(
      `/api/groups/${groupId}/wall?${params.toString()}`,
    );
    return response.data || [];
  },

  async createPost(
    groupId: string,
    content?: string,
    attachments?: WallPostAttachment[],
  ): Promise<WallPost> {
    const response = await chatApi.post<WallPost>(`/api/groups/${groupId}/wall`, {
      content,
      attachments,
    });
    return response.data;
  },

  async getAttachmentUrl(attachmentId: string): Promise<string> {
    const response = await chatApi.get<{ url: string }>(
      `/api/attachments/wall/${attachmentId}/url`,
    );
    return response.data.url;
  },

  async getWalls(): Promise<WallInboxEntry[]> {
    const response = await chatApi.get<WallInboxEntry[]>("/api/walls");
    return response.data || [];
  },
};
