import { chatFetch } from './chatHttpClient';
import type { ChatApiResponse, ChatPartner, DmAttachment, DmConversation, DmMessage } from '../domain/dm';

const toStr = (v: unknown): string => (typeof v === 'string' ? v : '');

const normalizePartner = (raw: unknown): ChatPartner => {
  const r = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  return {
    id: toStr(r.id),
    name: toStr(r.name),
    avatarUrl:
      typeof r.avatarUrl === 'string'
        ? r.avatarUrl
        : typeof r.avatar_url === 'string'
          ? r.avatar_url
          : undefined,
  };
};

const normalizeAttachment = (raw: unknown): DmAttachment => {
  const r = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  return {
    id: typeof r.id === 'string' ? r.id : undefined,
    fileName: toStr(r.fileName ?? r.file_name),
    fileType: toStr(r.fileType ?? r.file_type),
    fileSize:
      typeof r.fileSize === 'number'
        ? r.fileSize
        : typeof r.file_size === 'number'
          ? r.file_size
          : 0,
    storagePath: toStr(r.storagePath ?? r.storage_path),
  };
};

const normalizeMessage = (raw: unknown): DmMessage => {
  const r = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  return {
    id: toStr(r.id),
    conversationId: toStr(r.conversationId ?? r.conversation_id),
    senderId: toStr(r.senderId ?? r.sender_id),
    senderName:
      typeof r.senderName === 'string'
        ? r.senderName
        : typeof r.sender_name === 'string'
          ? r.sender_name
          : undefined,
    avatarUrl:
      typeof r.avatarUrl === 'string'
        ? r.avatarUrl
        : typeof r.avatar_url === 'string'
          ? r.avatar_url
          : undefined,
    content: typeof r.content === 'string' ? r.content : undefined,
    attachments: Array.isArray(r.attachments) ? r.attachments.map(normalizeAttachment) : [],
    createdAt: toStr(r.createdAt ?? r.created_at),
  };
};

const normalizeConversation = (raw: unknown): DmConversation => {
  const r = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const otherRaw = r.otherParticipant ?? r.other_participant;
  return {
    id: toStr(r.id),
    otherParticipant: normalizePartner(otherRaw),
    lastMessage:
      r.lastMessage != null
        ? normalizeMessage(r.lastMessage)
        : r.last_message != null
          ? normalizeMessage(r.last_message)
          : undefined,
    createdAt: toStr(r.createdAt ?? r.created_at),
  };
};

const safeJson = async (response: Response): Promise<unknown> => {
  try {
    return await response.json();
  } catch {
    return null;
  }
};

const getError = (payload: unknown, status: number): string => {
  if (payload && typeof payload === 'object') {
    const obj = payload as Record<string, unknown>;
    if (typeof obj.error === 'string' && obj.error.trim()) return obj.error;
    if (typeof obj.message === 'string' && obj.message.trim()) return obj.message;
  }
  return `Error ${status}`;
};

export const dmHttpService = {
  async getConversations(): Promise<ChatApiResponse<DmConversation[]>> {
    try {
      const response = await chatFetch('/conversations');
      const json = await safeJson(response);

      if (!response.ok) return { success: false, error: getError(json, response.status) };

      let items: unknown[] = [];
      if (Array.isArray(json)) {
        items = json;
      } else if (json && typeof json === 'object') {
        const p = json as Record<string, unknown>;
        if (Array.isArray(p.data)) items = p.data;
        else if (Array.isArray(p.conversations)) items = p.conversations;
      }

      return { success: true, data: items.map(normalizeConversation) };
    } catch {
      return { success: false, error: 'Error de conexión. Verifica tu conexión a internet.' };
    }
  },

  async getOrCreateConversation(
    targetUserId: string,
  ): Promise<ChatApiResponse<DmConversation>> {
    try {
      const response = await chatFetch('/conversations', {
        method: 'POST',
        body: JSON.stringify({ targetUserId }),
      });
      const json = await safeJson(response);

      if (!response.ok) return { success: false, error: getError(json, response.status) };

      return { success: true, data: normalizeConversation(json) };
    } catch {
      return { success: false, error: 'Error de conexión. Verifica tu conexión a internet.' };
    }
  },

  async getMessages(
    conversationId: string,
    params?: { limit?: number; before?: string },
  ): Promise<ChatApiResponse<DmMessage[]>> {
    try {
      const query = new URLSearchParams();
      if (params?.limit != null) query.set('limit', String(params.limit));
      if (params?.before) query.set('before', params.before);
      const qs = query.toString();

      const response = await chatFetch(
        `/conversations/${encodeURIComponent(conversationId)}/messages${qs ? `?${qs}` : ''}`,
      );
      const json = await safeJson(response);

      if (!response.ok) return { success: false, error: getError(json, response.status) };

      let messages: unknown[] = [];
      if (Array.isArray(json)) {
        messages = json;
      } else if (json && typeof json === 'object') {
        const p = json as Record<string, unknown>;
        if (Array.isArray(p.data)) messages = p.data;
        else if (Array.isArray(p.messages)) messages = p.messages;
      }

      return { success: true, data: messages.map(normalizeMessage) };
    } catch {
      return { success: false, error: 'Error de conexión. Verifica tu conexión a internet.' };
    }
  },

  async sendMessage(
    conversationId: string,
    content?: string,
    attachments: DmAttachment[] = [],
  ): Promise<ChatApiResponse<DmMessage>> {
    try {
      const response = await chatFetch(
        `/conversations/${encodeURIComponent(conversationId)}/messages`,
        {
          method: 'POST',
          body: JSON.stringify({ content, attachments }),
        },
      );
      const json = await safeJson(response);

      if (!response.ok) return { success: false, error: getError(json, response.status) };

      return { success: true, data: normalizeMessage(json) };
    } catch {
      return { success: false, error: 'Error de conexión. Verifica tu conexión a internet.' };
    }
  },

  async getAttachmentUrl(attachmentId: string): Promise<ChatApiResponse<string>> {
    try {
      const response = await chatFetch(
        `/attachments/dm/${encodeURIComponent(attachmentId)}/url`,
      );
      const json = await safeJson(response);

      if (!response.ok) return { success: false, error: getError(json, response.status) };

      const url =
        typeof json === 'string'
          ? json
          : json && typeof json === 'object'
            ? (toStr((json as Record<string, unknown>).url) ||
               toStr((json as Record<string, unknown>).signedUrl) ||
               toStr((json as Record<string, unknown>).signed_url))
            : '';

      if (!url) return { success: false, error: 'La respuesta no contiene una URL válida.' };
      return { success: true, data: url };
    } catch {
      return { success: false, error: 'Error de conexión. Verifica tu conexión a internet.' };
    }
  },
};
