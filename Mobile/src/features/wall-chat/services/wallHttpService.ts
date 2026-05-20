import chatApi from "../../../services/chatApi";
import type { Poll, WallInboxEntry, WallPost, WallPostAttachment } from "../types/wall.types";
import { normalizePoll, normalizePostPoll } from "../utils/pollNormalizer";

export const wallHttpService = {
  async getPosts(groupId: string, limit = 20, before?: string): Promise<WallPost[]> {
    const params = new URLSearchParams({ limit: String(limit) });
    if (before) params.append("before", before);
    const response = await chatApi.get<WallPost[]>(
      `/api/groups/${groupId}/wall?${params.toString()}`,
    );
    return (response.data || []).map(normalizePostPoll);
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
    return normalizePostPoll(response.data);
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

  async createPoll(
    groupId: string,
    question: string,
    options: string[],
    durationMinutes: number,
  ): Promise<WallPost> {
    const response = await chatApi.post<WallPost>(
      `/api/groups/${groupId}/wall/polls`,
      { question, options, durationMinutes },
    );
    return normalizePostPoll(response.data);
  },

  async votePoll(pollId: string, optionId: string): Promise<Poll> {
    const response = await chatApi.post<Poll>(
      `/api/polls/${pollId}/votes`,
      { optionId },
    );
    return normalizePoll(response.data) ?? response.data;
  },

  async closePoll(pollId: string): Promise<Poll> {
    const response = await chatApi.patch<Poll>(`/api/polls/${pollId}/close`);
    return normalizePoll(response.data) ?? response.data;
  },
};
