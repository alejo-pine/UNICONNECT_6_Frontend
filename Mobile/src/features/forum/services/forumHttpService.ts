import { API_BASE_URL } from '@/src/config/api';
import type {
  ForumApiResponse,
  ForumAnswer,
  ForumQuestion,
  CreateQuestionPayload,
  CreateAnswerPayload,
  AcceptAnswerPayload,
} from '../types/forum';

const FORUM_ENDPOINT = `${API_BASE_URL}/forum`;

const readJson = async (response: Response): Promise<unknown> => {
  try {
    return await response.json();
  } catch {
    return null;
  }
};

const getErrorMessage = (payload: unknown, fallbackStatus: number): string => {
  if (payload && typeof payload === 'object') {
    const p = payload as Record<string, unknown>;
    if (typeof p.error === 'string' && p.error.trim()) return p.error;
    if (typeof p.message === 'string' && p.message.trim()) return p.message;
  }
  return `Error ${fallbackStatus}`;
};

const extractData = <T>(json: unknown): T | undefined => {
  if (!json || typeof json !== 'object') return undefined;
  const p = json as Record<string, unknown>;
  if ('data' in p) return p.data as T;
  return json as T;
};

const authHeaders = (token: string) => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${token}`,
});

export const forumHttpService = {
  async getQuestions(
    subjectId: string,
    token: string,
  ): Promise<ForumApiResponse<ForumQuestion[]>> {
    try {
      const response = await fetch(
        `${FORUM_ENDPOINT}/subjects/${subjectId}/questions`,
        { method: 'GET', headers: authHeaders(token) },
      );
      const json = await readJson(response);
      if (response.status === 403) {
        return { success: false, error: 'Acceso denegado', isForbidden: true };
      }
      if (!response.ok) {
        return { success: false, error: getErrorMessage(json, response.status) };
      }
      const data = extractData<ForumQuestion[]>(json) ?? (Array.isArray(json) ? json : []);
      return { success: true, data: Array.isArray(data) ? data : [] };
    } catch {
      return { success: false, error: 'Error de conexión. Verifica tu conexión a internet.' };
    }
  },

  async createQuestion(
    payload: CreateQuestionPayload,
    token: string,
  ): Promise<ForumApiResponse<ForumQuestion>> {
    try {
      const response = await fetch(`${FORUM_ENDPOINT}/questions`, {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify(payload),
      });
      const json = await readJson(response);
      if (response.status === 403) {
        return {
          success: false,
          error: 'No tienes permisos para publicar en este foro.',
          isForbidden: true,
        };
      }
      if (!response.ok) {
        return { success: false, error: getErrorMessage(json, response.status) };
      }
      return { success: true, data: extractData<ForumQuestion>(json) };
    } catch {
      return { success: false, error: 'Error de conexión. Verifica tu conexión a internet.' };
    }
  },

  async getAnswers(
    questionId: string,
    token: string,
  ): Promise<ForumApiResponse<ForumAnswer[]>> {
    try {
      const response = await fetch(
        `${FORUM_ENDPOINT}/questions/${questionId}/answers`,
        { method: 'GET', headers: authHeaders(token) },
      );
      const json = await readJson(response);
      if (response.status === 403) {
        return { success: false, error: 'Acceso denegado', isForbidden: true };
      }
      if (!response.ok) {
        return { success: false, error: getErrorMessage(json, response.status) };
      }
      const data = extractData<ForumAnswer[]>(json) ?? (Array.isArray(json) ? json : []);
      return { success: true, data: Array.isArray(data) ? data : [] };
    } catch {
      return { success: false, error: 'Error de conexión. Verifica tu conexión a internet.' };
    }
  },

  async createAnswer(
    questionId: string,
    payload: CreateAnswerPayload,
    token: string,
  ): Promise<ForumApiResponse<ForumAnswer>> {
    try {
      const response = await fetch(
        `${FORUM_ENDPOINT}/questions/${questionId}/answers`,
        {
          method: 'POST',
          headers: authHeaders(token),
          body: JSON.stringify(payload),
        },
      );
      const json = await readJson(response);
      if (response.status === 403) {
        return {
          success: false,
          error: 'No tienes permisos para responder en este foro.',
          isForbidden: true,
        };
      }
      if (!response.ok) {
        return { success: false, error: getErrorMessage(json, response.status) };
      }
      return { success: true, data: extractData<ForumAnswer>(json) };
    } catch {
      return { success: false, error: 'Error de conexión. Verifica tu conexión a internet.' };
    }
  },

  async voteAnswer(
    answerId: string,
    token: string,
  ): Promise<ForumApiResponse<void>> {
    try {
      const response = await fetch(
        `${FORUM_ENDPOINT}/answers/${answerId}/vote`,
        { method: 'POST', headers: authHeaders(token) },
      );
      const json = await readJson(response);
      if (response.status === 403) {
        return { success: false, error: 'Acceso denegado', isForbidden: true };
      }
      if (!response.ok) {
        return { success: false, error: getErrorMessage(json, response.status) };
      }
      return { success: true };
    } catch {
      return { success: false, error: 'Error de conexión. Verifica tu conexión a internet.' };
    }
  },

  async acceptAnswer(
    answerId: string,
    payload: AcceptAnswerPayload,
    token: string,
  ): Promise<ForumApiResponse<void>> {
    try {
      const response = await fetch(
        `${FORUM_ENDPOINT}/answers/${answerId}/accept`,
        {
          method: 'POST',
          headers: authHeaders(token),
          body: JSON.stringify(payload),
        },
      );
      const json = await readJson(response);
      if (response.status === 403) {
        return {
          success: false,
          error: 'Solo los docentes pueden aceptar respuestas.',
          isForbidden: true,
        };
      }
      if (!response.ok) {
        return { success: false, error: getErrorMessage(json, response.status) };
      }
      return { success: true };
    } catch {
      return { success: false, error: 'Error de conexión. Verifica tu conexión a internet.' };
    }
  },
};
