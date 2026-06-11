import { chatFetch } from '@features/chat/infrastructure/chatHttpClient';
import type {
  SendMessagePayload,
  SendMessageResponse,
  ApiConversation,
  ApiMessage,
} from '../domain/chatbot';

async function readJson(res: Response): Promise<unknown> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

function extractArray<T>(json: unknown): T[] {
  if (Array.isArray(json)) return json as T[];
  if (json && typeof json === 'object') {
    const data = (json as Record<string, unknown>).data;
    if (Array.isArray(data)) return data as T[];
  }
  return [];
}

export const chatbotHttpService = {
  async sendMessage(payload: SendMessagePayload): Promise<SendMessageResponse> {
    try {
      const res = await chatFetch('/chatbot/message', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      const json = await readJson(res);
      if (!res.ok) {
        return {
          conversationId: payload.conversationId ?? '',
          reply: '',
          status: 'error',
          error: 'Error al comunicarse con el asistente. Intenta nuevamente.',
        };
      }
      return json as SendMessageResponse;
    } catch {
      return {
        conversationId: payload.conversationId ?? '',
        reply: '',
        status: 'error',
        error: 'Error de conexión. Verifica tu conexión a internet.',
      };
    }
  },

  async getConversations(): Promise<ApiConversation[]> {
    try {
      const res = await chatFetch('/chatbot/conversations');
      if (!res.ok) return [];
      const json = await readJson(res);
      return extractArray<ApiConversation>(json);
    } catch {
      return [];
    }
  },

  async getConversationMessages(id: string): Promise<ApiMessage[]> {
    try {
      const res = await chatFetch(`/chatbot/conversations/${encodeURIComponent(id)}/messages`);
      if (!res.ok) return [];
      const json = await readJson(res);
      return extractArray<ApiMessage>(json);
    } catch {
      return [];
    }
  },
};
