import { chatFetch } from './chatHttpClient';
import { useAuthStore } from '@shared/store/authStore';
import { API_BASE_URL } from '@shared/services/api/apiClient';
import type { ChatApiResponse, GroupMember, Poll, PollOption, WallAttachment, WallInboxItem, WallPost } from '../domain/wall';

const GROUPS_BASE = `${API_BASE_URL}/study-groups`;

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

const SPAM_PATTERN = /demasiados mensajes en poco tiempo/i;

const extractModeration = (
  payload: unknown,
  status: number,
): { error: string; moderationCode?: string; escalated?: boolean; ruleExplanation?: string } => {
  if (payload && typeof payload === 'object') {
    const obj = payload as Record<string, unknown>;
    // Backend now sends 'moderationCode'; fallback to legacy 'codigoError' for compat
    const code =
      typeof obj.moderationCode === 'string' ? obj.moderationCode :
      typeof obj.codigoError === 'string' ? obj.codigoError :
      undefined;
    if (code?.startsWith('MO_')) {
      // ruleExplanation is the detailed rule text shown in "¿Por qué?", kept separate from
      // the short banner message. Use detalle for legacy compat, else fall to obj.message.
      const ruleExplanation =
        typeof obj.ruleExplanation === 'string' && obj.ruleExplanation.trim()
          ? obj.ruleExplanation : undefined;
      const escalated = obj.escalated === true;
      const errorMsg =
        typeof obj.detalle === 'string' && obj.detalle.trim()
          ? obj.detalle : getError(payload, status);
      return { error: errorMsg, moderationCode: code, escalated, ruleExplanation };
    }
    // Fallback: detect MO_003 by message text if moderationCode field is absent
    const msg = typeof obj.message === 'string' ? obj.message : '';
    if (SPAM_PATTERN.test(msg)) {
      return { error: msg, moderationCode: 'MO_003' };
    }
  }
  return { error: getError(payload, status) };
};

const isModerationJson = (payload: unknown): boolean => {
  if (!payload || typeof payload !== 'object') return false;
  const obj = payload as Record<string, unknown>;
  return obj.valido === false &&
    typeof obj.codigoError === 'string' &&
    (obj.codigoError as string).startsWith('MO_');
};

const toStr = (v: unknown): string => (typeof v === 'string' ? v : '');

// normalizePollOption accepts the per-option raw object plus the poll-level
// userVotedOptionId so it can set votedByMe correctly without a per-option flag.
const normalizePollOption = (raw: unknown, votedOptionId?: string): PollOption => {
  const r = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const id = toStr(r.id);
  return {
    id,
    text: toStr(
      r.text ??
      r.optionText ??
      r.option_text ??
      r.label ??
      r.name,
    ),
    // Backend sends votesCount (not voteCount / vote_count)
    voteCount:
      typeof r.voteCount === 'number'
        ? r.voteCount
        : typeof r.votesCount === 'number'
          ? r.votesCount
          : typeof r.vote_count === 'number'
            ? r.vote_count
            : 0,
    percentage: typeof r.percentage === 'number' ? r.percentage : 0,
    // Backend sends userVotedOptionId at poll level, not votedByMe per option
    votedByMe:
      r.votedByMe === true ||
      r.voted_by_me === true ||
      r.hasVoted === true ||
      r.has_voted === true ||
      (votedOptionId != null && id !== '' && id === votedOptionId),
  };
};

export const normalizePoll = (raw: unknown): Poll | undefined => {
  if (!raw || typeof raw !== 'object') return undefined;
  const r = raw as Record<string, unknown>;
  // userVotedOptionId is the poll-level field the backend uses to signal which
  // option the current user voted on (instead of a per-option votedByMe flag).
  const votedOptionId =
    typeof r.userVotedOptionId === 'string' ? r.userVotedOptionId :
    typeof r.user_voted_option_id === 'string' ? r.user_voted_option_id :
    undefined;
  // Try all known array field names the backend may use
  const optionsRaw =
    Array.isArray(r.options)
      ? r.options
      : Array.isArray(r.poll_options)
        ? r.poll_options
        : Array.isArray(r.pollOptions)
          ? r.pollOptions
          : [];
  const rawOptions = optionsRaw.map((o) => normalizePollOption(o, votedOptionId));
  // Backend does not send totalVotes at root; compute it from option vote counts.
  const totalVotes =
    typeof r.totalVotes === 'number'
      ? r.totalVotes
      : typeof r.total_votes === 'number'
        ? r.total_votes
        : rawOptions.reduce((sum, o) => sum + o.voteCount, 0);
  // Recompute percentage from voteCount so it always stays in sync with the
  // counter (both derived from the backend's votesCount field).
  const options = rawOptions.map((opt) => ({
    ...opt,
    percentage: totalVotes > 0 ? Math.round((opt.voteCount / totalVotes) * 100) : 0,
  }));
  return {
    id: toStr(r.id),
    question: toStr(r.question ?? r.title),
    options,
    totalVotes,
    closed:
      r.closed === true ||
      r.isClosed === true ||
      r.is_closed === true,
    expiresAt:
      typeof r.expiresAt === 'string'
        ? r.expiresAt
        : typeof r.expires_at === 'string'
          ? r.expires_at
          : undefined,
    closedAt:
      typeof r.closedAt === 'string'
        ? r.closedAt
        : typeof r.closed_at === 'string'
          ? r.closed_at
          : undefined,
  };
};

const normalizeAttachment = (raw: unknown): WallAttachment => {
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

const normalizePost = (raw: unknown): WallPost => {
  const r = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  return {
    id: toStr(r.id),
    groupId: toStr(r.groupId ?? r.group_id),
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
    content: toStr(r.content),
    createdAt: toStr(r.createdAt ?? r.created_at),
    attachments: Array.isArray(r.attachments) ? r.attachments.map(normalizeAttachment) : [],
    mentions: Array.isArray(r.mentions)
      ? r.mentions.filter((m): m is string => typeof m === 'string')
      : [],
    mentionedNames: Array.isArray(r.mentionedNames)
      ? r.mentionedNames.filter((m): m is string => typeof m === 'string')
      : Array.isArray(r.mentioned_names)
        ? r.mentioned_names.filter((m): m is string => typeof m === 'string')
        : [],
    poll: r.poll != null ? normalizePoll(r.poll) : undefined,
  };
};

const normalizeInboxItem = (raw: unknown): WallInboxItem => {
  const r = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  return {
    groupId: toStr(r.groupId ?? r.group_id),
    groupName: toStr(r.groupName ?? r.group_name),
    lastPost:
      r.lastPost != null
        ? normalizePost(r.lastPost)
        : r.last_post != null
          ? normalizePost(r.last_post)
          : null,
  };
};

export { normalizePost as normalizeWallPost };

export const wallHttpService = {
  async getWalls(): Promise<ChatApiResponse<WallInboxItem[]>> {
    try {
      const response = await chatFetch('/walls');
      const json = await safeJson(response);

      if (!response.ok) return { success: false, error: getError(json, response.status) };

      let items: unknown[] = [];
      if (Array.isArray(json)) {
        items = json;
      } else if (json && typeof json === 'object') {
        const p = json as Record<string, unknown>;
        if (Array.isArray(p.data)) items = p.data;
        else if (Array.isArray(p.walls)) items = p.walls;
      }

      return { success: true, data: items.map(normalizeInboxItem) };
    } catch {
      return { success: false, error: 'Error de conexión. Verifica tu conexión a internet.' };
    }
  },

  async getWallHistory(
    groupId: string,
    params?: { limit?: number; before?: string },
  ): Promise<ChatApiResponse<WallPost[]>> {
    try {
      const query = new URLSearchParams();
      if (params?.limit != null) query.set('limit', String(params.limit));
      if (params?.before) query.set('before', params.before);
      const qs = query.toString();

      const response = await chatFetch(
        `/groups/${encodeURIComponent(groupId)}/wall${qs ? `?${qs}` : ''}`,
      );
      const json = await safeJson(response);

      if (!response.ok) return { success: false, error: getError(json, response.status) };

      let posts: unknown[] = [];
      if (Array.isArray(json)) {
        posts = json;
      } else if (json && typeof json === 'object') {
        const p = json as Record<string, unknown>;
        if (Array.isArray(p.data)) posts = p.data;
        else if (Array.isArray(p.posts)) posts = p.posts;
      }

      return { success: true, data: posts.map(normalizePost) };
    } catch {
      return { success: false, error: 'Error de conexión. Verifica tu conexión a internet.' };
    }
  },

  async sendPost(
    groupId: string,
    content: string,
    attachments: WallAttachment[] = [],
    mentions: string[] = [],
    mentionedNames: string[] = [],
  ): Promise<ChatApiResponse<WallPost>> {
    try {
      const response = await chatFetch(`/groups/${encodeURIComponent(groupId)}/wall`, {
        method: 'POST',
        body: JSON.stringify({ content, attachments, mentions, mentionedNames }),
      });
      const json = await safeJson(response);

      if (!response.ok || isModerationJson(json)) return { success: false, ...extractModeration(json, response.status) };

      const post = normalizePost(json);
      // Preserve mentionedNames locally if the backend doesn't echo them yet
      if (post.mentionedNames.length === 0 && mentionedNames.length > 0) {
        post.mentionedNames = mentionedNames;
      }
      return { success: true, data: post };
    } catch {
      return { success: false, error: 'Error de conexión. Verifica tu conexión a internet.' };
    }
  },

  async getGroupMembers(groupId: string): Promise<ChatApiResponse<GroupMember[]>> {
    try {
      const token = useAuthStore.getState().token;
      const response = await fetch(`${GROUPS_BASE}/${encodeURIComponent(groupId)}/members`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const json = await safeJson(response);

      if (!response.ok) return { success: false, error: getError(json, response.status) };

      let items: unknown[] = [];
      if (json && typeof json === 'object') {
        const p = json as Record<string, unknown>;
        if (Array.isArray(p.data)) items = p.data;
        else if (Array.isArray(p.members)) items = p.members;
      } else if (Array.isArray(json)) {
        items = json;
      }

      const members: GroupMember[] = items
        .filter((m): m is Record<string, unknown> => m !== null && typeof m === 'object')
        .map((m) => ({ id: toStr(m.id), name: toStr(m.name) }))
        .filter((m) => m.id && m.name);

      return { success: true, data: members };
    } catch {
      return { success: false, error: 'Error de conexión. Verifica tu conexión a internet.' };
    }
  },

  async getAttachmentUrl(attachmentId: string): Promise<ChatApiResponse<string>> {
    try {
      const response = await chatFetch(
        `/attachments/wall/${encodeURIComponent(attachmentId)}/url`,
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

  async createPoll(
    groupId: string,
    question: string,
    options: string[],
    durationMinutes: number,
  ): Promise<ChatApiResponse<WallPost>> {
    try {
      const response = await chatFetch(
        `/groups/${encodeURIComponent(groupId)}/wall/polls`,
        {
          method: 'POST',
          body: JSON.stringify({ question, options, durationMinutes }),
        },
      );
      const json = await safeJson(response);
      if (!response.ok) return { success: false, error: getError(json, response.status) };
      return { success: true, data: normalizePost(json) };
    } catch {
      return { success: false, error: 'Error de conexión. Verifica tu conexión a internet.' };
    }
  },

  async votePoll(
    pollId: string,
    optionId: string,
  ): Promise<ChatApiResponse<Poll>> {
    try {
      const response = await chatFetch(
        `/polls/${encodeURIComponent(pollId)}/votes`,
        {
          method: 'POST',
          body: JSON.stringify({ optionId }),
        },
      );
      const json = await safeJson(response);
      if (!response.ok) return { success: false, error: getError(json, response.status) };
      const poll = normalizePoll(json);
      if (!poll) return { success: false, error: 'Respuesta inesperada del servidor.' };
      return { success: true, data: poll };
    } catch {
      return { success: false, error: 'Error de conexión. Verifica tu conexión a internet.' };
    }
  },

  async closePoll(pollId: string): Promise<ChatApiResponse<Poll>> {
    try {
      const response = await chatFetch(
        `/polls/${encodeURIComponent(pollId)}/close`,
        { method: 'PATCH' },
      );
      const json = await safeJson(response);
      if (!response.ok) return { success: false, error: getError(json, response.status) };
      const poll = normalizePoll(json);
      if (!poll) return { success: false, error: 'Respuesta inesperada del servidor.' };
      return { success: true, data: poll };
    } catch {
      return { success: false, error: 'Error de conexión. Verifica tu conexión a internet.' };
    }
  },
};
